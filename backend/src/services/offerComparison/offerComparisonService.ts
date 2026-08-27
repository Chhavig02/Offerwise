import { Flag, NormalizedOfferData } from '@/types';
import { CompanyResearchOutcome, CompanyResearchResult, ResearchSource } from '../companyResearch/types';
import {
  ComparisonEvidence,
  InsightCategory,
  InsightSeverity,
  MarketDataProvider,
  OfferComparisonInsight,
  OfferComparisonResult
} from './types';
import { realMarketDataProvider } from './marketData/realMarketDataProvider';
import { combineMarketData } from './combineMarketData';

const RECENT_THRESHOLD_DAYS = 365;

function describeRecency(publishedAt?: string): string {
  if (!publishedAt) return '(publication date could not be confirmed)';
  const published = new Date(publishedAt);
  if (Number.isNaN(published.getTime())) return '(publication date could not be confirmed)';
  const ageDays = (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > RECENT_THRESHOLD_DAYS) {
    return `(historical: reported on ${published.toISOString().slice(0, 10)})`;
  }
  return '';
}

function findSource(sources: ResearchSource[], sourceId: string): ResearchSource | undefined {
  return sources.find(s => s.id === sourceId);
}

// Fields whose comparison insight is a tailored restatement of an existing,
// already-evidence-checked rules-engine flag. No new offer-term thresholds
// are introduced here -- the rules engine remains the single source of
// truth for what counts as "extended" or "present".
const EMPLOYMENT_TERM_RULES: Record<string, { title: string; explanation: (flag: Flag) => string }> = {
  TERM_NOTICE_EXTENDED: { title: 'Extended notice period', explanation: flag => flag.reason },
  TERM_PROBATION_EXTENDED: { title: 'Extended probation period', explanation: flag => flag.reason },
  TERM_BOND_PRESENT: { title: 'Training/employment bond present', explanation: () => 'Offer contains a training/employment bond.' },
  LEGAL_NON_COMPETE: { title: 'Non-compete clause present', explanation: () => 'This clause may warrant legal review depending on jurisdiction and exact wording.' }
};

function buildEmploymentTermInsights(flags: Flag[]): { insights: OfferComparisonInsight[]; comparedFields: string[] } {
  const insights: OfferComparisonInsight[] = [];
  const comparedFields = new Set<string>();

  for (const flag of flags) {
    const rule = flag.ruleId ? EMPLOYMENT_TERM_RULES[flag.ruleId] : undefined;
    if (!rule) continue;

    const evidence: ComparisonEvidence[] = flag.evidence.map(ev => ({
      claim: ev.sourceText || '',
      sourceTitle: ev.sourceLocation || undefined,
      evidenceType: 'offer_letter' as const
    }));

    insights.push({
      id: flag.ruleId as string,
      category: 'employment_terms',
      severity: 'caution',
      title: rule.title,
      explanation: rule.explanation(flag),
      evidence,
      confidence: 'high'
    });

    flag.sourceFieldIds.forEach(f => comparedFields.add(f));
  }

  return { insights, comparedFields: Array.from(comparedFields) };
}

async function compareCompensation(
  data: NormalizedOfferData,
  provider: MarketDataProvider
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ insight?: OfferComparisonInsight; limitation?: string; comparedField?: string; benchmark?: any }> {
  if (data.fixedSalary?.status !== 'found' || data.fixedSalary.value === null) {
    return {};
  }
  const comparedField = 'fixedSalary';

  if (data.role?.status !== 'found' || !data.role.value) {
    return { comparedField, limitation: 'Role context was not available, so compensation could not be benchmarked.' };
  }

  const currency = data.currency?.status === 'found' && data.currency.value ? data.currency.value : 'INR';
  // Only ever pass 'found' context to the market lookup -- 'uncertain' or
  // 'not_specified' location/experience must never be treated as trusted
  // input for a location-specific benchmark claim.
  const location = data.location?.status === 'found' && data.location.value ? data.location.value : undefined;
  const experienceLevel = data.experienceLevel?.status === 'found' && data.experienceLevel.value && data.experienceLevel.value !== 'unknown'
    ? data.experienceLevel.value
    : undefined;
  const rawBenchmark = await provider.getCompensationBenchmark({ role: data.role.value, location, experienceLevel, currency });

  const combined = combineMarketData(rawBenchmark ? [rawBenchmark] : []);
  if (combined.status === 'none') {
    return { comparedField, limitation: 'Insufficient reliable salary benchmark data was available.' };
  }
  if (combined.status === 'conflicting') {
    return {
      comparedField,
      limitation: 'Available salary sources report different ranges, so the benchmark should be treated as approximate.'
    };
  }

  const benchmark = combined.primary!;

  if (benchmark.currency !== currency) {
    return {
      comparedField,
      limitation: 'Benchmark currency did not match the offer currency, so the comparison was skipped to avoid an unsafe conversion.'
    };
  }

  const fixed = data.fixedSalary.value;
  let severity: InsightSeverity = 'neutral';
  let title = 'Compensation within available benchmark range';
  let explanation = `Reported compensation appears within the available benchmark range for ${benchmark.role}.`;

  if (benchmark.minimum !== undefined && fixed < benchmark.minimum) {
    severity = 'caution';
    title = 'Compensation below available benchmark';
    explanation = `Reported compensation appears below the available benchmark range for ${benchmark.role}.`;
  } else if (benchmark.maximum !== undefined && fixed > benchmark.maximum) {
    severity = 'positive';
    title = 'Compensation above available benchmark';
    explanation = `Reported compensation appears above the available benchmark range for ${benchmark.role}.`;
  }

  if (benchmark.median !== undefined) {
    explanation += ` Reported market median is approximately ${benchmark.median} ${currency}.`;
  }
  if (!benchmark.location) {
    explanation += ' The available benchmark does not include sufficient location or experience context.';
  }
  if (benchmark.experienceLevel) {
    // Experience is kept for transparency but never used to filter the
    // Adzuna query -- the histogram has no real experience segmentation.
    explanation += ' The benchmark is based on role and location; the available source does not provide an experience-specific salary distribution.';
  }
  explanation += ' This is an estimate derived from a salary distribution, not an exact statistic.';

  const evidence: ComparisonEvidence[] = [
    {
      claim: data.fixedSalary.evidence?.sourceText || `Fixed salary of ${fixed} ${currency}`,
      evidenceType: 'offer_letter'
    },
    {
      claim: `Benchmark range ${benchmark.minimum ?? '?'}–${benchmark.maximum ?? '?'} ${benchmark.currency} (median ~${benchmark.median ?? '?'}), retrieved ${benchmark.retrievedAt}`,
      sourceUrl: benchmark.source.url,
      sourceTitle: benchmark.source.title,
      evidenceType: 'market_data'
    }
  ];

  return {
    comparedField,
    benchmark,
    insight: {
      id: 'CMP_COMPENSATION_BENCHMARK',
      category: 'compensation',
      severity,
      title,
      explanation,
      evidence,
      confidence: benchmark.confidence
    }
  };
}

function buildSignalInsights(result: CompanyResearchResult, lowConfidence: boolean): OfferComparisonInsight[] {
  const insights: OfferComparisonInsight[] = [];

  for (const signal of result.signals) {
    const primaryEvidence = signal.evidence[0];
    const source = primaryEvidence ? findSource(result.sources, primaryEvidence.sourceId) : undefined;
    const recencyNote = describeRecency(source?.publishedAt);
    const publisher = source?.publisher || 'available sources';

    let category: InsightCategory;
    let severity: InsightSeverity;
    let title: string;
    let explanation: string;

    switch (signal.type) {
      case 'hiring':
        category = 'positive_signal';
        severity = 'positive';
        title = 'Recent hiring activity reported';
        explanation = `Recent company hiring/expansion activity may be a positive signal. ${recencyNote}`.trim();
        break;
      case 'layoffs':
      case 'restructuring':
        category = 'caution';
        severity = 'caution';
        title = signal.type === 'layoffs' ? 'Recent layoffs reported' : 'Recent restructuring reported';
        explanation = `Recent ${signal.type} has been reported by ${publisher}. This may be relevant to employer-stability considerations. ${recencyNote}`.trim();
        break;
      case 'legal':
      case 'regulatory':
        category = 'caution';
        severity = 'caution';
        title = 'Recent legal/regulatory development';
        explanation = `A recent legal matter involving the company was identified in the available sources. This does not by itself establish misconduct or predict the outcome of your employment. ${recencyNote}`.trim();
        break;
      case 'funding':
      case 'acquisition':
        category = 'market_context';
        severity = 'neutral';
        title = signal.type === 'funding' ? 'Recent funding activity reported' : 'Recent acquisition activity reported';
        explanation = `Recent ${signal.type} activity involving the company was reported by ${publisher}. ${recencyNote}`.trim();
        break;
      default:
        // company_status / other: not enough signal to say something
        // non-generic without risking a fabricated claim.
        continue;
    }

    const evidence: ComparisonEvidence[] = signal.evidence.map(ev => {
      const src = findSource(result.sources, ev.sourceId);
      return {
        sourceId: ev.sourceId,
        sourceUrl: src?.url,
        sourceTitle: src?.title,
        claim: ev.claim,
        evidenceType: 'company_research' as const
      };
    });

    insights.push({
      id: `CMP_SIGNAL_${signal.type.toUpperCase()}_${insights.length}`,
      category,
      severity,
      title,
      explanation,
      evidence,
      confidence: lowConfidence ? 'low' : signal.confidence
    });
  }

  return insights;
}

export class OfferComparisonService {
  constructor(private readonly marketDataProvider: MarketDataProvider) {}

  async compare(
    data: NormalizedOfferData,
    companyResearch: CompanyResearchOutcome,
    flags: Flag[]
  ): Promise<OfferComparisonResult> {
    try {
      if (companyResearch.status === 'unavailable') {
        return {
          status: 'unavailable',
          insights: [],
          comparedFields: [],
          limitations: ['Company research was unavailable, so employer-specific comparison could not be completed.']
        };
      }

      const insights: OfferComparisonInsight[] = [];
      const comparedFields = new Set<string>();
      const limitations: string[] = [];

      const { insights: termInsights, comparedFields: termFields } = buildEmploymentTermInsights(flags);
      insights.push(...termInsights);
      termFields.forEach(f => comparedFields.add(f));

      // Isolated separately from the rest of comparison: a market-data
      // provider failure should only degrade the compensation insight, not
      // discard employment-terms/company insights that have nothing to do
      // with it. RealMarketDataProvider already catches its own errors and
      // returns null, but this is a defense-in-depth boundary regardless.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let marketCompensation: any = null;
      try {
        const compResult = await compareCompensation(data, this.marketDataProvider);
        if (compResult.insight) insights.push(compResult.insight);
        if (compResult.comparedField) comparedFields.add(compResult.comparedField);
        if (compResult.limitation) limitations.push(compResult.limitation);
        if (compResult.benchmark) marketCompensation = compResult.benchmark;
      } catch (err) {
        console.error('[OfferComparison] Market data lookup failed:', err instanceof Error ? err.message : 'unknown error');
        limitations.push('Market compensation data was unavailable.');
      }

      const result = companyResearch.result;
      const identityLow = result.companyIdentityConfidence !== 'high';
      if (identityLow) {
        limitations.push(
          'The company identity could not be verified with high confidence, so company-specific findings should be treated cautiously.'
        );
      }

      const signalInsights = buildSignalInsights(result, identityLow);
      insights.push(...signalInsights);
      if (signalInsights.length > 0 || result.officialWebsite) {
        comparedFields.add('companyIdentity');
      }
      if (result.signals.length === 0) {
        limitations.push(
          'No notable recent company signals (layoffs, funding, restructuring, legal, hiring) were found in available sources.'
        );
      }

      const status: OfferComparisonResult['status'] = limitations.length === 0 ? 'available' : 'partial';

      return {
        status,
        insights,
        comparedFields: Array.from(comparedFields),
        limitations,
        marketCompensation
      };
    } catch (err) {
      console.error('[OfferComparison] Comparison failed:', err instanceof Error ? err.message : 'unknown error');
      return {
        status: 'unavailable',
        insights: [],
        comparedFields: [],
        limitations: ['Comparison could not be completed due to an internal error.']
      };
    }
  }
}

export const offerComparisonService = new OfferComparisonService(realMarketDataProvider);
