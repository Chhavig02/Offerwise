import React from 'react';
import { CompanyResearchOutcome, SignalType } from '@/types';
import { Building2, Info, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface CompanyStoryProps {
  research: CompanyResearchOutcome | undefined;
  offerId: string;
}

export function CompanyStory({ research, offerId }: CompanyStoryProps) {
  if (!research || research.status !== 'available') {
    return (
      <div id="company" className="scroll-mt-24 max-w-4xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 text-center">Who Are You Joining?</h2>
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center gap-3 shadow-sm">
          <Building2 className="w-8 h-8 text-slate-400" />
          <p className="text-slate-600 font-medium">Company research wasn&apos;t available for this assessment.</p>
          <p className="text-xs text-slate-400">This does not negatively impact your offer score.</p>
        </div>
      </div>
    );
  }

  const { signals } = research.result;
  
  const warningTypes: SignalType[] = ['layoffs', 'restructuring', 'legal', 'regulatory'];
  const warning = signals.filter(s => warningTypes.includes(s.type));
  const hasLowConfidence = research.result.companyIdentityConfidence === 'low';

  return (
    <div id="company" className="scroll-mt-24 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Who Are You Joining?</h2>
        <p className="text-slate-600 mt-2">
          Here&apos;s what we found about the company behind your offer.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        
        {hasLowConfidence ? (
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base">Company identity needs verification</h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">
                We found company information that may not confidently match the employer in your offer. It is important to verify the employer&apos;s official details.
              </p>
            </div>
          </div>
        ) : warning.length > 0 ? (
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base">One or more signals need your attention</h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">
                We found some recent news (like restructuring or layoffs) that you should be aware of before joining.
              </p>
            </div>
          </div>
        ) : signals.length > 0 ? (
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base">Positive or neutral signals detected</h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">
                We found recent news (like funding or hiring growth) about the company you are joining.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base">Company verified</h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">
                We verified the company identity and found no major web signals (like restructuring, funding, or legal news) that require your immediate attention.
              </p>
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 pt-6 flex justify-center">
          <Link
            href={`/company-intelligence?offerId=${offerId}`}
            className="inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-6 py-3 rounded-xl text-sm font-bold transition-colors"
          >
            View full company research <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
