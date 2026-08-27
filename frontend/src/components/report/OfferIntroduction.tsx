import React from 'react';
import { NormalizedOfferData } from '@/types';
import { MapPin, Monitor, Star } from 'lucide-react';

interface OfferIntroductionProps {
  ext: NormalizedOfferData | undefined;
  annualTotalComp: number | null;
  currencySymbol: string;
}

export function OfferIntroduction({ ext, annualTotalComp, currencySymbol }: OfferIntroductionProps) {
  const company = ext?.companyName?.value || 'a company';
  const role = ext?.role?.value || 'a new role';
  
  const formatMoney = (val: number) => {
    if (val >= 100000) {
      return `${currencySymbol}${(val / 100000).toFixed(1)}L`;
    }
    return `${currencySymbol}${val.toLocaleString()}`;
  };

  const getCompString = () => {
    if (annualTotalComp !== null) return formatMoney(annualTotalComp);
    if (ext?.fixedSalary?.value) return formatMoney(ext.fixedSalary.value);
    return 'an unstated amount';
  };

  return (
    <div id="intro" className="space-y-6 scroll-mt-24">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Let&apos;s understand your offer
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Here&apos;s what <strong className="text-indigo-600">{company}</strong> is offering you for the <strong className="text-slate-800">{role}</strong> role,
          with a total package of <strong className="font-mono text-emerald-600">{getCompString()}</strong>.
        </p>
        {annualTotalComp !== null && (
          <p className="text-xs text-slate-400 max-w-xl mx-auto -mt-2">
            This is your guaranteed take-home (fixed + variable pay) — it may read lower than the &quot;CTC&quot; figure in your offer letter. See the pay breakdown below for why.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {ext?.location?.value && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>{ext.location.value}</span>
          </div>
        )}
        {ext?.workMode?.value && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold capitalize">
            <Monitor className="w-3.5 h-3.5" />
            <span>{ext.workMode.value}</span>
          </div>
        )}
        {ext?.experienceLevel?.value && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold capitalize">
            <Star className="w-3.5 h-3.5" />
            <span>{ext.experienceLevel.value} level</span>
          </div>
        )}
      </div>
    </div>
  );
}
