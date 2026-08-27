import React from 'react';
import { DecisionFactor } from '@/types';
import { HelpCircle } from 'lucide-react';

interface UnknownsChecklistProps {
  beforeAccepting: DecisionFactor[];
}

export function UnknownsChecklist({ beforeAccepting }: UnknownsChecklistProps) {
  if (beforeAccepting.length === 0) {
    return null;
  }

  return (
    <div id="unknowns" className="scroll-mt-24 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">What We Still Don&apos;t Know</h2>
        <p className="text-slate-600 mt-2">
          These aren&apos;t necessarily problems. They&apos;re details the offer letter doesn&apos;t tell us yet.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="space-y-4">
          {beforeAccepting.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
              <div className="mt-0.5 shrink-0">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-800">{item.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed mt-1">{item.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
