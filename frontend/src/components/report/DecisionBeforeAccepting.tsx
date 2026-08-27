import React, { useState } from 'react';
import { DecisionFactor } from '@/types';
import { CheckSquare } from 'lucide-react';

interface DecisionBeforeAcceptingProps {
  items: DecisionFactor[];
}

export function DecisionBeforeAccepting({ items }: DecisionBeforeAcceptingProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  if (items.length === 0) {
    return null;
  }

  const toggleCheck = (idx: number) => {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div id="before-accepting" className="scroll-mt-24 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Before you accept</h2>
        <p className="text-slate-600 mt-2">
          Make sure you&apos;ve clarified these points with the employer.
        </p>
      </div>

      <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 shadow-sm">
        <div className="space-y-3">
          {items.map((item, idx) => {
            const isChecked = checked[idx];
            return (
              <button
                key={idx}
                onClick={() => toggleCheck(idx)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl transition-all text-left border ${
                  isChecked 
                    ? 'bg-emerald-50/50 border-emerald-200 opacity-60' 
                    : 'bg-white border-white hover:border-indigo-200 shadow-sm'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <CheckSquare className={`w-5 h-5 transition-colors ${isChecked ? 'text-emerald-500' : 'text-slate-300'}`} />
                </div>
                <div className="min-w-0">
                  <h4 className={`font-bold ${isChecked ? 'text-emerald-800 line-through' : 'text-slate-800'}`}>
                    {item.title}
                  </h4>
                  <p className={`text-sm leading-relaxed mt-1 ${isChecked ? 'text-emerald-700/60 line-through' : 'text-slate-600'}`}>
                    {item.explanation}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-sm text-indigo-700/70 mt-6 font-medium px-4">
          Once these questions are answered, you&apos;ll have a much clearer picture of whether this offer is right for you.
        </p>
      </div>
    </div>
  );
}
