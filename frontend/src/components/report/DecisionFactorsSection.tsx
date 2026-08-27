import React from 'react';
import { DecisionFactor } from '@/types';
import { AlertOctagon, AlertTriangle, Eye, Info } from 'lucide-react';

interface DecisionFactorsSectionProps {
  concerns: DecisionFactor[];
  onOpenEvidence: (title: string) => void;
}

export function DecisionFactorsSection({ concerns, onOpenEvidence }: DecisionFactorsSectionProps) {
  if (concerns.length === 0) {
    return (
      <div id="concerns" className="scroll-mt-24 max-w-4xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 text-center">The Things That Need Your Attention</h2>
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-3">
          <Info className="w-5 h-5 text-slate-400" />
          <span className="text-slate-600 font-medium">No major concerns were found in this offer.</span>
        </div>
      </div>
    );
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return {
          icon: <AlertOctagon className="w-5 h-5 text-rose-600" />,
          bg: 'bg-rose-50/80',
          border: 'border-rose-200',
          titleColor: 'text-rose-900',
          badgeBg: 'bg-rose-100',
          badgeText: 'text-rose-800'
        };
      case 'medium':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          bg: 'bg-amber-50/80',
          border: 'border-amber-200',
          titleColor: 'text-amber-900',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-800'
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-slate-500" />,
          bg: 'bg-slate-50/80',
          border: 'border-slate-200',
          titleColor: 'text-slate-800',
          badgeBg: 'bg-slate-200',
          badgeText: 'text-slate-700'
        };
    }
  };

  return (
    <div id="concerns" className="scroll-mt-24 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">The Things That Need Your Attention</h2>
        <p className="text-slate-600 mt-2">
          These are the issues most likely to affect your decision.
        </p>
      </div>

      <div className="space-y-4 mt-6">
        {concerns.map((concern, idx) => {
          const config = getSeverityConfig(concern.severity);
          
          return (
            <div key={idx} className={`p-5 rounded-2xl border ${config.bg} ${config.border}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">{config.icon}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h4 className={`font-bold min-w-0 break-words ${config.titleColor}`}>{concern.title}</h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${config.badgeBg} ${config.badgeText}`}>
                        {concern.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{concern.explanation}</p>
                  </div>
                </div>

                {(concern.evidence as unknown[])?.length > 0 && (
                  <button
                    onClick={() => onOpenEvidence(concern.title)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 bg-white border border-slate-200 rounded-full transition-colors shrink-0 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Source
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
