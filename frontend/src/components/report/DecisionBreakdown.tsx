import React from 'react';
import { DecisionBasis } from '@/types';
import { CheckCircle2, AlertTriangle, HelpCircle, Layers } from 'lucide-react';

interface DecisionBreakdownProps {
  basis: DecisionBasis[];
}

export function DecisionBreakdown({ basis }: DecisionBreakdownProps) {
  if (!basis || basis.length === 0) {
    return null;
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'favorable':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          bgColor: 'bg-emerald-50/50',
          borderColor: 'border-emerald-100',
          textColor: 'text-emerald-900',
          label: 'Favorable'
        };
      case 'acceptable':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-indigo-500" />,
          bgColor: 'bg-indigo-50/50',
          borderColor: 'border-indigo-100',
          textColor: 'text-indigo-900',
          label: 'Acceptable'
        };
      case 'unfavorable':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
          bgColor: 'bg-rose-50/50',
          borderColor: 'border-rose-100',
          textColor: 'text-rose-900',
          label: 'Unfavorable'
        };
      case 'incomplete':
      default:
        return {
          icon: <HelpCircle className="w-5 h-5 text-slate-400" />,
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          textColor: 'text-slate-600',
          label: 'Incomplete'
        };
    }
  };

  const formatDimension = (dim: string) => {
    switch (dim) {
      case 'compensation': return 'Compensation';
      case 'contract_terms': return 'Contract Terms';
      case 'market_position': return 'Market Position';
      case 'company_profile': return 'Company Profile';
      case 'completeness': return 'Offer Completeness';
      default: return dim.replace('_', ' ');
    }
  };

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
        <Layers className="w-5 h-5 text-indigo-600" />
        Decision Breakdown
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {basis.map((item, idx) => {
          const config = getStatusConfig(item.status);
          
          return (
            <div key={idx} className={`p-5 rounded-2xl border ${config.bgColor} ${config.borderColor} transition-all`}>
              <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {formatDimension(item.dimension)}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border shadow-sm shrink-0 ${config.textColor}`}>
                  {config.label}
                </span>
              </div>
              
              <div className="flex items-start gap-3 mt-3">
                <div className="shrink-0 mt-0.5">{config.icon}</div>
                <p className={`text-xs leading-relaxed ${item.status === 'incomplete' ? 'text-slate-500 italic' : 'text-slate-700 font-medium'}`}>
                  {item.summary}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
