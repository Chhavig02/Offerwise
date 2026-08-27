import React from 'react';
import { TrendingUp, Users, AlertTriangle, ShieldAlert, Award, ExternalLink } from 'lucide-react';

interface CompanySignalCardProps {
  type: 'hiring' | 'growth' | 'funding' | 'layoffs' | 'restructuring' | 'legal';
  title: string;
  summary: string;
  sourceName?: string;
  sourceUrl?: string;
  confidence?: 'high' | 'medium' | 'low';
  date?: string;
}

export function CompanySignalCard({
  type,
  title,
  summary,
  sourceName = 'Available News & Financial Sources',
  sourceUrl,
  confidence = 'high',
  date = 'Recent'
}: CompanySignalCardProps) {
  const getSignalConfig = () => {
    switch (type) {
      case 'hiring':
        return { icon: Users, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', badge: '🟢 Hiring Activity' };
      case 'growth':
      case 'funding':
        return { icon: TrendingUp, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', badge: '🟢 Growth Signal' };
      case 'restructuring':
        return { icon: AlertTriangle, bg: 'bg-amber-50 text-amber-700 border-amber-200', badge: '🟡 Restructuring' };
      case 'layoffs':
      case 'legal':
        return { icon: ShieldAlert, bg: 'bg-rose-50 text-rose-700 border-rose-200', badge: '🔴 Risk Indicator' };
      default:
        return { icon: Award, bg: 'bg-slate-50 text-slate-700 border-slate-200', badge: 'Market Context' };
    }
  };

  const config = getSignalConfig();
  const Icon = config.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.bg}`}>
          {config.badge}
        </span>
        <span className="text-[11px] font-semibold text-slate-400 capitalize">
          {confidence} Confidence • {date}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-slate-50 text-slate-600 mt-0.5">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-slate-900 mb-1">{title}</h4>
          <p className="text-xs text-slate-600 leading-relaxed mb-2">{summary}</p>
          
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <span>Source: {sourceName}</span>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 ml-1"
              >
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
