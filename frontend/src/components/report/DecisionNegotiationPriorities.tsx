import React from 'react';
import { DecisionFactor } from '@/types';
import { Target } from 'lucide-react';

interface DecisionNegotiationPrioritiesProps {
  priorities: DecisionFactor[];
}

export function DecisionNegotiationPriorities({ priorities }: DecisionNegotiationPrioritiesProps) {
  if (priorities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mt-12 bg-indigo-50/50 p-6 md:p-8 rounded-3xl border border-indigo-100">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-indigo-950 tracking-tight">
          What Should You Negotiate?
        </h3>
      </div>
      
      <p className="text-sm text-indigo-900/70 max-w-2xl">
        Based on the risks and market positioning of this offer, we recommend focusing your negotiation on the following items, ranked by priority.
      </p>

      <div className="space-y-4 pt-2">
        {priorities.map((factor, idx) => (
          <div key={idx} className="flex gap-4 p-5 bg-white rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-100/50">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 text-sm">
              {idx + 1}
            </div>
            <div className="space-y-1.5 pt-1">
              <h4 className="font-bold text-slate-900">{factor.title}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-700">Why it matters: </span>
                {factor.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
