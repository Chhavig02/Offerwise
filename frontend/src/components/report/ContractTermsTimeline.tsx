import React from 'react';
import { NormalizedOfferData } from '@/types';
import { FileText, Eye } from 'lucide-react';

interface ContractTermsTimelineProps {
  ext: NormalizedOfferData | undefined;
  onOpenEvidence: (title: string) => void;
}

export function ContractTermsTimeline({ ext, onOpenEvidence }: ContractTermsTimelineProps) {
  if (!ext) return null;

  const terms = [];

  if (ext.hasBond?.status === 'found' && ext.hasBond.value === true) {
    terms.push({
      title: 'Training / Employment Bond',
      says: `You are required to stay for ${ext.bondDurationMonths?.value || 'an unspecified number of'} months, or pay a penalty of ${ext.bondBuyoutAmount?.value ? ext.bondBuyoutAmount.value.toLocaleString() : 'an unspecified amount'}.`,
      means: 'You are financially locked into this company for the bond duration.',
      check: 'Check if the penalty decreases pro-rata over time, and if it applies if you are terminated.',
      fieldKey: 'hasBond'
    });
  }

  if (ext.hasNonCompete?.status === 'found' && ext.hasNonCompete.value === true) {
    terms.push({
      title: 'Non-Compete Clause',
      says: 'You are restricted from joining competitors after leaving this company.',
      means: 'Your future job options in the same industry may be temporarily limited.',
      check: 'Verify the exact duration and geographic scope of the restriction.',
      fieldKey: 'hasNonCompete'
    });
  }

  if (ext.noticePeriodDays?.status === 'found' && ext.noticePeriodDays.value !== null) {
    terms.push({
      title: 'Notice Period',
      says: `You must give ${ext.noticePeriodDays.value} days of notice before resigning.`,
      means: ext.noticePeriodDays.value > 60 ? 'This is a long notice period, which can make it very hard to switch jobs quickly.' : 'This is a standard notice period.',
      check: 'Check if the employer must give you the exact same notice if they terminate you.',
      fieldKey: 'noticePeriodDays'
    });
  }

  if (ext.probationPeriodMonths?.status === 'found' && ext.probationPeriodMonths.value !== null) {
    terms.push({
      title: 'Probation Period',
      says: `You will be on probation for ${ext.probationPeriodMonths.value} months.`,
      means: 'During this time, you can usually be terminated with very little notice.',
      check: 'Check what the notice period is during probation versus after confirmation.',
      fieldKey: 'probationPeriodMonths'
    });
  }

  if (terms.length === 0) {
    return (
      <div id="contract" className="scroll-mt-24 max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">What Are You Agreeing To?</h2>
        </div>
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-600">
          No significant restrictive terms (like bonds or non-competes) were found in this offer.
        </div>
      </div>
    );
  }

  return (
    <div id="contract" className="scroll-mt-24 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">What Are You Agreeing To?</h2>
        <p className="text-slate-600 mt-2">
          Here is a breakdown of the most important clauses in your contract.
        </p>
      </div>

      <div className="relative mt-8 pl-4 md:pl-8 space-y-8 before:absolute before:inset-0 before:ml-[1.7rem] md:before:ml-[2.7rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {terms.map((term, idx) => (
          <div key={idx} className="relative flex items-start group">
            <div className="absolute left-[-1.5rem] md:left-[-2.5rem] w-6 h-6 bg-white border-2 border-indigo-200 rounded-full flex items-center justify-center mt-1 group-hover:border-indigo-400 transition-colors z-10">
              <div className="w-2 h-2 bg-indigo-400 rounded-full group-hover:bg-indigo-600 transition-colors" />
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm w-full group-hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-lg min-w-0">
                  <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span className="break-words min-w-0">{term.title}</span>
                </div>
                <button
                  onClick={() => onOpenEvidence(term.fieldKey)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 bg-slate-50 border border-slate-200 rounded-full transition-colors shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Text
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">What it says</h5>
                  <p className="text-sm text-slate-700 font-medium">{term.says}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 border-t border-slate-100">
                  <div className="flex-1">
                    <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">What it means for you</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">{term.means}</p>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">What you should check</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">{term.check}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
