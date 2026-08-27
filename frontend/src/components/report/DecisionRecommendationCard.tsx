import React from 'react';
import { DecisionAssessment } from '@/types';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, ShieldCheck, Layers } from 'lucide-react';
import { DecisionBreakdown } from './DecisionBreakdown';

interface DecisionRecommendationCardProps {
  decision: DecisionAssessment;
}

export function DecisionRecommendationCard({ decision }: DecisionRecommendationCardProps) {
  const getRecommendationConfig = (rec: string) => {
    switch (rec) {
      case 'accept':
        return {
          label: 'ACCEPT',
          colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          Icon: CheckCircle2,
          iconColor: 'text-emerald-600'
        };
      case 'negotiate':
        return {
          label: 'NEGOTIATE',
          colorClass: 'bg-amber-50 border-amber-200 text-amber-800',
          Icon: AlertTriangle,
          iconColor: 'text-amber-600'
        };
      case 'reject':
        return {
          label: 'REJECT',
          colorClass: 'bg-rose-50 border-rose-200 text-rose-800',
          Icon: AlertCircle,
          iconColor: 'text-rose-600'
        };
      case 'needs_more_information':
        return {
          label: 'NEEDS MORE INFO',
          colorClass: 'bg-blue-50 border-blue-200 text-blue-800',
          Icon: HelpCircle,
          iconColor: 'text-blue-600'
        };
      default:
        return {
          label: 'UNKNOWN',
          colorClass: 'bg-slate-50 border-slate-200 text-slate-800',
          Icon: HelpCircle,
          iconColor: 'text-slate-600'
        };
    }
  };

  const getConfidenceExplanation = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'Most material offer terms were verified and sufficient evidence was available.';
      case 'medium': return 'Some supporting information was unavailable or uncertain.';
      case 'low': return 'Important information could not be fully verified.';
      default: return 'Confidence level could not be determined.';
    }
  };

  const config = getRecommendationConfig(decision.recommendation);
  const Icon = config.Icon;

  return (
    <div id="decision" className="scroll-mt-24 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">So, what should you do?</h2>
      </div>

      <div className={`p-6 rounded-3xl border ${config.colorClass} shadow-sm transition-all`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-black/5">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-3">
              <Icon className={`w-8 h-8 ${config.iconColor}`} />
              <span className={`text-2xl font-extrabold tracking-tight ${config.iconColor}`}>
                {config.label}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="group relative flex items-center gap-1.5 cursor-help">
              <ShieldCheck className="w-4 h-4 opacity-70" />
              <span className="text-sm font-bold capitalize border-b border-dashed border-current opacity-80 pb-0.5">
                {decision.confidence} Confidence
              </span>
              <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-900 text-slate-100 text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-left">
                {getConfidenceExplanation(decision.confidence)}
              </div>
            </div>
            <span className="text-[10px] font-mono opacity-60">
              Engine {decision.decisionEngineVersion}
            </span>
          </div>
        </div>

        <div className="pt-6">
          <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-2">Why we think this</h3>
          <p className="text-base font-medium leading-relaxed opacity-90">
            {decision.summary}
          </p>
        </div>
      </div>

      {/* Decision Breakdown Grid */}
      <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <Layers className="w-5 h-5 text-indigo-500" />
          The Final Breakdown
        </h3>
        <DecisionBreakdown basis={decision.decisionBasis} />
      </div>
    </div>
  );
}
