import React from 'react';

interface ScoreCardGaugeProps {
  score: number;
  label?: string;
  subtitle?: string;
  onOpenDetails?: () => void;
}

export function ScoreCardGauge({
  score,
  label = 'Strong Offer',
  subtitle = 'Competitive overall, with some terms worth reviewing.',
  onOpenDetails
}: ScoreCardGaugeProps) {
  // Determine color theme based on score
  const getTheme = (s: number) => {
    if (s >= 80) return { stroke: '#10B981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (s >= 65) return { stroke: '#6366F1', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (s >= 50) return { stroke: '#F59E0B', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { stroke: '#EF4444', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const theme = getTheme(score);
  const strokeDashoffset = 283 - (283 * score) / 100;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Overall Offer Score</div>

      {/* SVG Circular Gauge */}
      <div className="relative w-36 h-36 flex items-center justify-center mb-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            className="stroke-slate-100"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={theme.stroke}
            strokeWidth="8"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
            {score}
          </span>
          <span className="text-xs font-medium text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Quality Badge */}
      <span className={`px-3 py-1 rounded-full text-xs font-bold border mb-2 ${theme.bg}`}>
        {label}
      </span>

      <p className="text-xs text-slate-500 max-w-xs mb-4 leading-relaxed">
        {subtitle}
      </p>

      {onOpenDetails && (
        <button
          onClick={onOpenDetails}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 mt-auto"
        >
          View Score Details →
        </button>
      )}
    </div>
  );
}
