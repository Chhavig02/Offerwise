'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { OfferComparisonResult, NormalizedOfferData, AnalysisResult } from '@/types';
import { MarketRangeBar } from '@/components/report/MarketRangeBar';
import { Info, ExternalLink, Lightbulb } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function MarketIntelligenceContent() {
  const searchParams = useSearchParams();
  const offerIdParam = searchParams ? searchParams.get('offerId') : null;
  const { user } = useAuth();
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [comparison, setComparison] = useState<OfferComparisonResult | null>(null);
  const [extracted, setExtracted] = useState<NormalizedOfferData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        let targetId = offerIdParam;
        if (!targetId) {
          const listRes = await fetch(`${apiUrl}/api/offers`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (listRes.ok) {
            const listJson = await listRes.json();
            if (listJson.data && listJson.data.length > 0) {
              targetId = listJson.data[0].id;
            }
          }
        }

        if (targetId) {
          const res = await fetch(`${apiUrl}/api/offers/${targetId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const json = await res.json();
            if (json.data) {
              setAnalysis(json.data);
              setComparison(json.data.comparison || { status: 'unavailable', insights: [], comparedFields: [], limitations: [] });
              setExtracted(json.data.extractedData || null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch market data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [user, offerIdParam]);

  const role = extracted?.role?.value || 'Offer';
  const location = extracted?.location?.value || 'Not specified';
  const currencySymbol = extracted?.currency?.value === 'USD' ? '$' : '₹';
  const fixedSalary = extracted?.fixedSalary?.value ?? null;
  const marketComp = comparison?.marketCompensation;

  const formatSalary = (val: number) => {
    if (val >= 100000) {
      return `${currencySymbol}${(val / 100000).toFixed(1)}L`;
    }
    return `${currencySymbol}${val.toLocaleString()}`;
  };

  const getInterpretationText = () => {
    if (fixedSalary === null || !marketComp || marketComp.minimum === undefined || marketComp.median === undefined || marketComp.maximum === undefined) return null;

    const minDiff = Math.abs(fixedSalary - marketComp.minimum);
    const medianDiff = Math.abs(fixedSalary - marketComp.median);
    const pctDiff = Math.round((medianDiff / marketComp.median) * 100);

    if (fixedSalary < marketComp.minimum) {
      return `Your fixed salary of ${formatSalary(fixedSalary)} is ${formatSalary(minDiff)} below the available market range and ${formatSalary(medianDiff)} below the market median. Your fixed salary is approximately ${pctDiff}% below the market median.`;
    } else if (fixedSalary > marketComp.maximum) {
      return `Your fixed salary of ${formatSalary(fixedSalary)} is ${formatSalary(Math.abs(fixedSalary - marketComp.maximum))} above the available market range and ${formatSalary(medianDiff)} above the market median. Your fixed salary is approximately ${pctDiff}% above the market median.`;
    } else {
      const positionText = fixedSalary < marketComp.median ? 'below' : fixedSalary > marketComp.median ? 'above' : 'exactly at';
      return `Your fixed salary of ${formatSalary(fixedSalary)} is within the available market range. It is ${positionText === 'exactly at' ? '' : `${formatSalary(medianDiff)} `}${positionText} the market median${positionText !== 'exactly at' ? ` (approximately ${pctDiff}% ${positionText})` : ''}.`;
    }
  };

  const getWhatItMeans = () => {
    if (fixedSalary === null || !marketComp || marketComp.median === undefined) return null;
    
    if (fixedSalary < marketComp.median) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            Your fixed compensation is below the market median for this role and location. This gives you a reasonable basis to discuss higher fixed compensation before accepting.
          </p>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">What should you negotiate?</h4>
              <p className="text-sm text-amber-800">
                Consider prioritizing fixed compensation in your negotiation.
              </p>
              {analysis?.offer_id && (
                <Link href={`/report/${analysis.offer_id}#negotiate`} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-2 inline-flex items-center gap-1">
                  View Negotiation Assistant <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <p className="text-sm text-slate-700 leading-relaxed font-medium">
          Your fixed compensation is above the market median, which is a positive signal.
        </p>
      );
    }
  };

  // Filter out non-market limitations
  const marketLimitations = comparison?.limitations?.filter(lim => 
    !lim.toLowerCase().includes('company identity') && 
    !lim.toLowerCase().includes('company research')
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-xs">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Offerwise Report
            </span>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[200px] sm:max-w-xs">
            {role} • {location}
          </span>
        </header>

        <main className="px-6 py-12 md:px-12 md:py-16 max-w-3xl w-full mx-auto space-y-12">
          
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">How does your pay compare?</h1>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : marketComp && fixedSalary !== null && marketComp.minimum !== undefined && marketComp.median !== undefined && marketComp.maximum !== undefined ? (
            <div className="space-y-8">
              
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <MarketRangeBar
                  yourOffer={fixedSalary}
                  minRange={marketComp.minimum}
                  medianRange={marketComp.median}
                  maxRange={marketComp.maximum}
                  currency={currencySymbol}
                  sourceText={marketComp.source?.title || `Adzuna Benchmark`}
                  retrievedDate={new Date(marketComp.retrievedAt).toLocaleDateString()}
                />
                
                <div className="pt-6 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-800 leading-relaxed text-center">
                    {getInterpretationText()}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">What this means for you</h3>
                {getWhatItMeans()}
              </div>

              {marketLimitations.length > 0 && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Transparency</span>
                  <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1 leading-relaxed">
                    {marketLimitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                    <li>Market estimates are based on available salary distribution data and should not be treated as exact statistics.</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Info className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Market comparison isn&apos;t available for this offer yet.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                {marketLimitations.length > 0 ? marketLimitations.join(' ') : 'We couldn\'t find a reliable benchmark for this specific role and location.'} This does not negatively affect your decision by itself.
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default function MarketIntelligencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-xs text-slate-500">
        Loading market intelligence...
      </div>
    }>
      <MarketIntelligenceContent />
    </Suspense>
  );
}
