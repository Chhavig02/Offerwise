import React from 'react';
import { NormalizedOfferData } from '@/types';
import { Banknote, TrendingUp, Gift } from 'lucide-react';

interface PayBreakdownProps {
  ext: NormalizedOfferData | undefined;
  annualTotalComp: number | null;
  currencySymbol: string;
}

export function PayBreakdown({ ext, annualTotalComp, currencySymbol }: PayBreakdownProps) {
  const formatMoney = (val: number) => {
    if (val >= 100000) {
      return `${currencySymbol}${(val / 100000).toFixed(1)}L`;
    }
    return `${currencySymbol}${val.toLocaleString()}`;
  };

  const fixed = ext?.fixedSalary?.value || 0;
  const variable = ext?.variableSalary?.value || 0;
  const bonus = ext?.joiningBonus?.value || 0;

  return (
    <div id="pay" className="scroll-mt-24 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">What Are You Actually Getting Paid?</h2>
        <p className="text-slate-600 mt-2">
          {annualTotalComp ? (
            <>Your total package is <strong className="text-indigo-600">{formatMoney(annualTotalComp)}</strong></>
          ) : (
            'We couldn\'t determine your total package.'
          )}
          {fixed > 0 && variable > 0 ? (
            <>, but only <strong className="text-slate-900">{formatMoney(fixed)} is fixed</strong> and <strong className="text-slate-900">{formatMoney(variable)} is variable</strong>.</>
          ) : fixed > 0 ? (
            <>, entirely composed of fixed pay.</>
          ) : null}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
            <Banknote className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Fixed Base</span>
          <span className="text-xl font-mono font-bold text-emerald-900">
            {fixed > 0 ? formatMoney(fixed) : 'Unstated'}
          </span>
          <p className="text-[10px] text-emerald-700/80 mt-2 leading-relaxed">
            Guaranteed income, paid out regardless of company performance.
          </p>
        </div>

        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Variable Pay</span>
          <span className="text-xl font-mono font-bold text-amber-900">
            {variable > 0 ? formatMoney(variable) : 'Unstated'}
          </span>
          <p className="text-[10px] text-amber-700/80 mt-2 leading-relaxed">
            Not guaranteed. Depends on personal or company performance targets.
          </p>
        </div>

        <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
            <Gift className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Joining Bonus</span>
          <span className="text-xl font-mono font-bold text-indigo-900">
            {bonus > 0 ? formatMoney(bonus) : 'None'}
          </span>
          <p className="text-[10px] text-indigo-700/80 mt-2 leading-relaxed">
            One-time payment. Often tied to a retention clawback period.
          </p>
        </div>
      </div>
    </div>
  );
}
