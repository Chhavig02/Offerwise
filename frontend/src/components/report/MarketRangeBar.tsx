import React from 'react';
import { Info } from 'lucide-react';

interface MarketRangeBarProps {
  yourOffer: number;
  minRange: number;
  medianRange: number;
  maxRange: number;
  currency?: string;
  sourceText?: string;
  retrievedDate?: string;
}

export function MarketRangeBar({
  yourOffer = 1000000,
  minRange = 1000000,
  medianRange = 1880000,
  maxRange = 2000000,
  currency = '₹',
  sourceText = 'Adzuna Salary Data',
  retrievedDate = 'August 2026'
}: MarketRangeBarProps) {
  const formatSalary = (val: number) => {
    if (val >= 100000) {
      return `${currency}${(val / 100000).toFixed(1)}L`;
    }
    return `${currency}${val.toLocaleString()}`;
  };

  const getStatusBadge = () => {
    if (yourOffer < minRange) {
      return { label: 'Below Market Range', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (yourOffer > maxRange) {
      return { label: 'Above Market Range', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return { label: 'Within Market Range', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const status = getStatusBadge();

  // Extend the track visually so pins don't clip at 0% or 100%
  // The mathematical range is minRange to maxRange, but we add 10% padding on each side.
  const paddingPercent = 10;
  const rangeSpan = Math.max(1, maxRange - minRange);
  
  // Calculate raw percentages
  const rawOfferPercent = ((yourOffer - minRange) / rangeSpan) * 100;
  const rawMedianPercent = ((medianRange - minRange) / rangeSpan) * 100;

  // Map 0-100% to 10-90% to leave room for labels
  const mapToTrack = (pct: number) => {
    return paddingPercent + (pct * (100 - paddingPercent * 2) / 100);
  };

  // Bound the visible percentages so they don't fly off screen entirely
  const offerPercent = Math.min(100, Math.max(0, mapToTrack(rawOfferPercent)));
  const medianPercent = Math.min(100, Math.max(0, mapToTrack(rawMedianPercent)));
  const minPercent = paddingPercent;
  const maxPercent = 100 - paddingPercent;

  return (
    <div className="bg-white rounded-xl shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Base Salary Market Alignment</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="relative pt-10 pb-8 px-4 mb-4">
        {/* Track Line */}
        <div className="h-4 bg-slate-100 rounded-full w-full relative overflow-hidden">
          {/* Active Range Gradient bounded between min and max */}
          <div 
            className="absolute top-0 bottom-0 bg-gradient-to-r from-slate-200 via-indigo-200 to-indigo-300 rounded-full" 
            style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
          />
        </div>

        {/* Market Median Pin */}
        <div
          className="absolute top-4 transform -translate-x-1/2 flex flex-col items-center z-10"
          style={{ left: `${medianPercent}%` }}
        >
          <div className="w-3 h-3 rounded-full bg-slate-400 border-2 border-white shadow-xs" />
          <span className="text-[10px] font-bold text-slate-500 mt-2 whitespace-nowrap bg-white/80 px-1 rounded">
            Median: {formatSalary(medianRange)}
          </span>
        </div>

        {/* Your Offer Base Salary Pin */}
        <div
          className="absolute top-1 transform -translate-x-1/2 flex flex-col items-center z-20"
          style={{ left: `${offerPercent}%` }}
        >
          <span className="text-xs font-bold text-white bg-indigo-600 px-3 py-1 rounded-lg shadow-sm whitespace-nowrap mb-1">
            You: {formatSalary(yourOffer)}
          </span>
          <div className="w-5 h-5 rounded-full bg-indigo-600 border-4 border-white shadow-md" />
        </div>

        {/* Min & Max Labels */}
        <div 
          className="absolute top-14 transform -translate-x-1/2 text-xs font-semibold text-slate-400 font-mono"
          style={{ left: `${minPercent}%` }}
        >
          {formatSalary(minRange)}
        </div>
        <div 
          className="absolute top-14 transform -translate-x-1/2 text-xs font-semibold text-slate-400 font-mono"
          style={{ left: `${maxPercent}%` }}
        >
          {formatSalary(maxRange)}
        </div>
      </div>
      
      {yourOffer < minRange && (
        <div className="mt-2 text-center text-xs font-bold text-amber-600">
          Your pay is below the reported market range.
        </div>
      )}

      {/* Methodology Disclaimer & Source Footer */}
      <div className="flex flex-col gap-2 pt-6 mt-4 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Source: <strong>{sourceText}</strong> ({retrievedDate}).</span>
        </div>
      </div>
    </div>
  );
}
