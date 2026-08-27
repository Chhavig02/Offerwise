'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Flag, Evidence } from '@/types';

interface EvidenceDrawerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFlagTitle?: string;
  flags?: Flag[];
}

export function EvidenceDrawerPanel({ isOpen, onClose, selectedFlagTitle, flags = [] }: EvidenceDrawerPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'selected'>('selected');

  if (!isOpen) return null;

  const allFlagsWithEvidence = flags.filter(
    f => f.type === 'risk' && f.evidence && f.evidence.length > 0 && f.evidence.some(ev => ev.sourceText)
  );

  const selectedFlag = selectedFlagTitle
    ? flags.find(f => f.title === selectedFlagTitle)
    : null;

  const displayedFlags = activeTab === 'selected' && selectedFlag
    ? [selectedFlag]
    : allFlagsWithEvidence;

  const totalEvidenceCount = allFlagsWithEvidence.reduce(
    (acc, f) => acc + f.evidence.filter(ev => ev.sourceText).length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">

          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Evidence &amp; Grounded Sources</h3>
                <p className="text-xs text-slate-500">Every conclusion is traceable to offer text</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedFlagTitle && (
            <div className="px-6 py-2.5 bg-indigo-50/80 border-b border-indigo-100 text-xs font-semibold text-indigo-800">
              Showing evidence for: <span className="underline">{selectedFlagTitle}</span>
            </div>
          )}

          {selectedFlagTitle && (
            <div className="flex border-b border-slate-200 px-6 bg-white gap-2">
              {[
                { id: 'selected', label: 'This Flag' },
                { id: 'all', label: `All Evidence (${totalEvidenceCount})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-3 px-2 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {displayedFlags.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No verified evidence available</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Evidence is only shown for risk flags verified against the offer letter text.
                </p>
              </div>
            ) : (
              displayedFlags.map((flag) => {
                const verifiedEvidence: Evidence[] = flag.evidence.filter(ev => ev.sourceText);
                if (verifiedEvidence.length === 0) return null;
                return (
                  <div key={flag.id} className="space-y-3">
                    <div className="flex items-center gap-2 pb-1">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900">{flag.title}</span>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        flag.severity === 'high' || flag.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {flag.severity} risk
                      </span>
                    </div>
                    {verifiedEvidence.map((ev, evIdx) => (
                      <div key={evIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Offer Letter Evidence</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            verified
                          </span>
                        </div>
                        {ev.sourceText && (
                          <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs italic text-slate-700 font-mono leading-relaxed">
                            &quot;{ev.sourceText}&quot;
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 pt-1">
                          Source: <strong>Uploaded Offer Letter</strong>
                          {ev.sourcePage && ` • Page ${ev.sourcePage}`}
                          {ev.sourceLocation && ` • ${ev.sourceLocation}`}
                        </div>
                      </div>
                    ))}
                    <div className="border-b border-slate-100 pb-1" />
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
            <p className="text-[11px] text-slate-500">
              Offerwise evidence validation ensures no AI claims are displayed without verified offer letter grounding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
