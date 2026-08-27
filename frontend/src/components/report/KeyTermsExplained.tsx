/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { NormalizedOfferData, ExtractedField } from '@/types';
import { BookOpen, ShieldAlert, ExternalLink } from 'lucide-react';

interface KeyTermsExplainedProps {
  extractedData: NormalizedOfferData | undefined;
  onOpenEvidence: (title: string) => void;
}

interface TermDefinition {
  key: string;
  name: string;
  definition: string;
  whyItMatters: (val: any) => string;
  whatToCheck: string;
  getValueString: (field: ExtractedField<any> | undefined) => string;
  getField: (data: NormalizedOfferData) => ExtractedField<any> | undefined;
  isTriggered: (field: ExtractedField<any> | undefined) => boolean;
}

export const KeyTermsExplained: React.FC<KeyTermsExplainedProps> = ({ extractedData, onOpenEvidence }) => {
  if (!extractedData) return null;

  const termsDefinitions: TermDefinition[] = [
    {
      key: 'fixedSalary',
      name: 'Base Salary (Fixed Pay)',
      definition: 'The guaranteed fixed component of your compensation, paid monthly before taxes and deductions.',
      whyItMatters: () => 'This is your guaranteed monthly income and forms the basis of your Provident Fund (PF), Gratuity, and future increments.',
      whatToCheck: 'Ensure the fixed salary matches your verbal agreement and check the breakdown (Basic, HRA, Special Allowance).',
      getField: (data) => data.fixedSalary,
      isTriggered: (field) => !!field && field.status === 'found',
      getValueString: (field) => field && field.value !== null ? `₹${(field.value / 100000).toFixed(1)}L / yr` : 'Not specified'
    },
    {
      key: 'variableSalary',
      name: 'Variable Salary (Performance Pay)',
      definition: 'A discretionary or performance-linked salary component tied to individual, team, or corporate milestones.',
      whyItMatters: () => 'Unlike base salary, variable pay is not guaranteed. High variable-to-fixed ratios increase your income risk.',
      whatToCheck: 'Confirm target metrics, payout frequency (monthly/quarterly/annual), and historical corporate payout percentages.',
      getField: (data) => data.variableSalary,
      isTriggered: (field) => !!field && field.status === 'found' && field.value !== null && field.value > 0,
      getValueString: (field) => field && field.value !== null ? `₹${(field.value / 100000).toFixed(1)}L / yr` : 'Not specified'
    },
    {
      key: 'joiningBonus',
      name: 'Joining Bonus (Sign-on Bonus)',
      definition: 'A one-time cash incentive paid upon joining or within the first few months of employment.',
      whyItMatters: () => 'Provides immediate liquidity but is usually subject to a clawback period (typically 12 months) requiring full repayment if you leave early.',
      whatToCheck: 'Check the repayment/clawback duration and if taxes deducted on the bonus are also required to be repaid.',
      getField: (data) => data.joiningBonus,
      isTriggered: (field) => !!field && field.status === 'found' && field.value !== null && field.value > 0,
      getValueString: (field) => field && field.value !== null ? `₹${field.value.toLocaleString()}` : 'Not specified'
    },
    {
      key: 'hasBond',
      name: 'Training & Employment Bond',
      definition: 'A contractual commitment requiring you to stay with the employer for a minimum duration or pay a buyout penalty.',
      whyItMatters: (val) => val === true ? 'Restricts your career mobility and imposes a significant financial liability if you resign before the bond ends.' : 'No bond is specified, meaning you can resign by serving notice without financial penalties.',
      whatToCheck: 'Check if the buyout penalty is a flat fee or amortizes/decreases over time. Broad employment bonds without high actual training cost are often legally unenforceable.',
      getField: (data) => data.hasBond,
      isTriggered: (field) => !!field && (field.status === 'found' || field.status === 'uncertain'),
      getValueString: (field) => field && field.value === true ? 'Present (Service obligation)' : 'None detected'
    },
    {
      key: 'hasNonCompete',
      name: 'Post-Employment Non-Compete',
      definition: 'A clause restricting you from joining competitor companies or working in the same niche after leaving.',
      whyItMatters: (val) => val === true ? 'Attempts to restrict your post-employment job choices. In India, broad post-employment non-compete clauses are generally legally void.' : 'No post-employment non-compete detected.',
      whatToCheck: 'Review Section 27 of the Indian Contract Act. Note that post-employment restrictions are invalid in India, though active-employment restrictions are legal.',
      getField: (data) => data.hasNonCompete,
      isTriggered: (field) => !!field && (field.status === 'found' || field.status === 'uncertain'),
      getValueString: (field) => field && field.value === true ? 'Present (Restrictions apply)' : 'None detected'
    },
    {
      key: 'noticePeriodDays',
      name: 'Notice Period',
      definition: 'The mandatory advance notice you must provide before your resignation takes effect.',
      whyItMatters: (val) => typeof val === 'number' && val >= 90 ? 'A 90-day notice period is highly restrictive and can make future job searches very difficult as new employers want quick joining.' : 'Allows for an orderly transition.',
      whatToCheck: 'Confirm if notice buyout (paying salary in lieu of serving notice) is permitted at the company’s discretion.',
      getField: (data) => data.noticePeriodDays,
      isTriggered: (field) => !!field && field.status === 'found',
      getValueString: (field) => field && field.value !== null ? `${field.value} days` : 'Not specified'
    },
    {
      key: 'probationPeriodMonths',
      name: 'Probation Period',
      definition: 'An initial trial period (typically 3 to 6 months) to assess your performance before formal confirmation.',
      whyItMatters: () => 'Notice periods are usually shorter (e.g. 15 days) during probation, and the employer can terminate you more easily.',
      whatToCheck: 'Ask whether probation automatically ends at the end of the duration or requires a formal written confirmation letter.',
      getField: (data) => data.probationPeriodMonths,
      isTriggered: (field) => !!field && field.status === 'found',
      getValueString: (field) => field && field.value !== null ? `${field.value} months` : 'Not specified'
    },
    {
      key: 'hasRelocation',
      name: 'Relocation & Transfer Policy',
      definition: 'Rules surrounding employee transfer to different offices and reimbursement of moving expenses.',
      whyItMatters: () => 'Mandatory relocation can significantly impact your cost of living and personal life.',
      whatToCheck: 'Verify if relocation allowance is covered or if they require you to arrange moving logistics yourself.',
      getField: (data) => data.hasRelocation,
      isTriggered: (field) => !!field && field.status === 'found',
      getValueString: (field) => field && field.value === true ? 'Applicable (Relocation required)' : 'Not required'
    },
    {
      key: 'insurance',
      name: 'Health Insurance & Benefits',
      definition: 'Employer-sponsored medical coverage for you and potentially your dependents.',
      whyItMatters: () => 'Protects you from high out-of-pocket medical bills. Comprehensive group coverage is a valuable benefit.',
      whatToCheck: 'Verify the sum insured (coverage amount) and if parents, spouse, or children are covered.',
      getField: (data) => data.insurance,
      isTriggered: (field) => !!field && field.status === 'found',
      getValueString: (field) => field && field.value === true ? 'Provided (Group Cover)' : 'Not specified'
    }
  ];

  // We only show terms that are relevant (either explicitly found/uncertain, OR explicitly missing)
  const activeTerms = termsDefinitions.filter(t => {
    const f = t.getField(extractedData);
    return t.isTriggered(f);
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-slate-900">Understand Your Offer — Key Terms Explained</h3>
          <p className="text-xs text-slate-500">Generic definitions combined with your actual offer-specific values</p>
        </div>
      </div>

      {activeTerms.length === 0 ? (
        <p className="text-xs text-slate-500 italic">No complex restrictive contractual terms were extracted from this offer letter.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTerms.map((term) => {
            const f = term.getField(extractedData);
            const valueStr = term.getValueString(f);
            const isAlert = f?.value === true && (term.key === 'hasBond' || term.key === 'hasNonCompete');

            return (
              <div 
                key={term.key} 
                className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                  isAlert 
                    ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    {isAlert && <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />}
                    {term.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                    isAlert 
                      ? 'bg-rose-100 text-rose-800' 
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                  }`}>
                    {valueStr}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {term.definition}
                </p>

                <div className="space-y-1 text-[11px]">
                  <p className="text-slate-600">
                    <strong className="text-slate-950 block mb-0.5">What it means for you:</strong> 
                    {term.whyItMatters(f?.value)}
                  </p>
                  <p className="text-slate-600">
                    <strong className="text-slate-950 block mb-0.5">What to check:</strong> 
                    {term.whatToCheck}
                  </p>
                </div>

                {f?.evidence?.sourceText && (
                  <button
                    onClick={() => onOpenEvidence(term.name)}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline pt-1 flex items-center gap-1"
                  >
                    <span>View Cited Evidence</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
