import { MarketCompensationData } from './types';

const DISAGREEMENT_THRESHOLD = 0.25; // >25% median divergence counts as conflicting

export interface CombinedMarketData {
  status: 'none' | 'single' | 'agreeing' | 'conflicting';
  // The benchmark to actually use for a below/within/above call. Absent
  // when status is 'none' or 'conflicting' -- a disputed benchmark is never
  // used to make that call, per "do not blindly average incompatible
  // sources" and "expose the source ranges, use conservative wording."
  primary?: MarketCompensationData;
  all: MarketCompensationData[];
}

function medianOf(data: MarketCompensationData): number | null {
  if (data.median !== undefined) return data.median;
  if (data.minimum !== undefined && data.maximum !== undefined) return (data.minimum + data.maximum) / 2;
  return null;
}

/**
 * Only Adzuna feeds this today, so it's always called with 0-1 candidates
 * in production -- the multi-source paths are real, tested logic for when
 * a second provider is added later, not yet reachable live.
 */
export function combineMarketData(candidates: MarketCompensationData[]): CombinedMarketData {
  if (candidates.length === 0) return { status: 'none', all: [] };
  if (candidates.length === 1) return { status: 'single', primary: candidates[0], all: candidates };

  const medians = candidates.map(medianOf).filter((m): m is number => m !== null);
  if (medians.length < candidates.length) {
    // Can't defensibly assess agreement without a median from every source.
    return { status: 'conflicting', all: candidates };
  }

  const maxMedian = Math.max(...medians);
  const minMedian = Math.min(...medians);
  const divergence = minMedian > 0 ? (maxMedian - minMedian) / minMedian : 0;

  if (divergence > DISAGREEMENT_THRESHOLD) {
    return { status: 'conflicting', all: candidates };
  }

  return { status: 'agreeing', primary: candidates[0], all: candidates };
}
