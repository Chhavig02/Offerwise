import React from 'react';
import { X, HelpCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Flag } from '@/types';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  flags: Flag[];
}

export function ScoreBreakdownModal({ isOpen, onClose, score, flags }: ScoreBreakdownModalProps) {
  if (!isOpen) return null;

  // Filter only risks that actually have score impact
  const riskDeductions = flags.filter(
    (f) => f.type === 'risk' && f.scoreImpact && f.scoreImpact > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Why this score?</h3>
            <p className="text-xs text-slate-500">Transparent rule-based score calculation</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
          Offerwise scores start at <strong>100</strong>. Deductions are applied strictly based on verified contractual risks. Information gaps do not penalize your score.
        </p>

        <div className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-1">
          {/* Starting Score Row */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50/20">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800">Starting Base Score</p>
                <p className="text-[11px] text-slate-500">Initial score before contract analysis</p>
              </div>
            </div>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              100 pts
            </span>
          </div>

          {/* Deductions */}
          {riskDeductions.length === 0 ? (
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">No Contractual Risks Found</p>
                  <p className="text-[11px] text-slate-500">No score deductions applied to this offer.</p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                0 pts
              </span>
            </div>
          ) : (
            riskDeductions.map((flag) => (
              <div
                key={flag.id}
                className="flex items-start justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/10 hover:border-rose-200 transition-colors"
              >
                <div className="flex items-start gap-2.5 mr-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{flag.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {flag.reason}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 shrink-0">
                  -{flag.scoreImpact} pts
                </span>
              </div>
            ))
          )}

          {/* Final Score Row */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-indigo-200 bg-indigo-50/30 mt-4">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">Final Offer Score</p>
                <p className="text-[11px] text-slate-500">Result of all verified risk adjustments</p>
              </div>
            </div>
            <span className="text-sm font-extrabold font-mono px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
              {score} / 100
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
