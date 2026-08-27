'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Upload,
  Award,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  Plus
} from 'lucide-react';

interface MappedOffer {
  id: string;
  company: string;
  role: string;
  date: string;
  status: string;
  score: number | null;
  qualityLabel: string;
  qualityBg: string;
  infoGapCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [offers, setOffers] = useState<MappedOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  useEffect(() => {
    const fetchRealOffers = async () => {
      if (!user) {
        setLoadingOffers(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/offers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          const rawData = json.data || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: MappedOffer[] = rawData.map((item: any) => {
            const score = typeof item.analysis?.score === 'number' ? item.analysis.score : null;
            const label = score === null ? (item.status === 'failed' ? 'Analysis Failed' : 'Processing') : score >= 80 ? 'Strong Offer' : score >= 70 ? 'Good Offer' : 'Fair Offer';
            const bg = score === null
              ? (item.status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200')
              : score >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : score >= 70 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200';
            const extracted = item.analysis?.extractedData;
            return {
              id: item.id,
              company: extracted?.companyName?.value || 'Not specified',
              role: extracted?.role?.value || 'Not specified',
              date: new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              status: item.status,
              score,
              qualityLabel: label,
              qualityBg: bg,
              infoGapCount: Array.isArray(item.analysis?.informationGaps) ? item.analysis.informationGaps.length : 0
            };
          });
          setOffers(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch real user offers:', err);
      } finally {
        setLoadingOffers(false);
      }
    };

    fetchRealOffers();
  }, [user]);

  const activeOffersList = offers;
  const isDashboardEmpty = !loadingOffers && offers.length === 0;
  const scoredOffers = activeOffersList.filter(o => o.score !== null);
  const averageScore = scoredOffers.length > 0
    ? Math.round(scoredOffers.reduce((acc, curr) => acc + (curr.score as number), 0) / scoredOffers.length)
    : 0;
  const totalInfoGaps = activeOffersList.reduce((acc, curr) => acc + curr.infoGapCount, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Welcome back 👋
            </h1>
            <p className="text-xs text-slate-500">Here&apos;s your offer analysis overview.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Offer</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Offers Analyzed</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  {isDashboardEmpty ? 0 : activeOffersList.length}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Average Score</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  {isDashboardEmpty ? '—' : `${averageScore}/100`}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Strong Offers</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  {isDashboardEmpty ? 0 : activeOffersList.filter(o => o.score !== null && o.score >= 80).length}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Information Gaps</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  {isDashboardEmpty ? 0 : totalInfoGaps}
                </span>
              </div>
            </div>
          </div>

          {/* Main Grid: Recent Analyses + Quick Tips */}
          {isDashboardEmpty ? (
            /* EMPTY DASHBOARD STATE */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 my-8">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No offers analyzed yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your first offer letter and we&apos;ll help you understand what you&apos;re really getting, verify compensation against the market, and detect contractual risks.
              </p>
              <div className="pt-2">
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Analyze My First Offer</span>
                </Link>
              </div>
            </div>
          ) : (
            /* POPULATED DASHBOARD */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Recent Analyses List (8 Cols) */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Recent Analyses</h2>
                    <p className="text-xs text-slate-500">Click any offer to open its full intelligence report</p>
                  </div>
                  <Link href="/my-offers" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                    <span>View all analyses</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {activeOffersList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/report/${item.id}`)}
                      className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 transition-all cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                          {item.company !== 'Not specified' ? item.company[0].toUpperCase() : '?'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {item.company}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {item.role} • Analyzed on {item.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-lg font-extrabold text-slate-900 font-mono block">
                            {item.score !== null ? `${item.score}/100` : '—'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.qualityBg}`}>
                            {item.qualityLabel}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Tips Panel (4 Cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Quick Tips</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Upload clear offer letter</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">PDF or DOCX format works best for precise evidence matching.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Check information gaps</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Missing details affect your overall decision confidence.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Review all evidence</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">We show grounded sources for every single extracted claim.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner CTA */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-sm border border-indigo-800/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Negotiation Intelligence</span>
                  <h4 className="text-sm font-bold">Have multiple job offers?</h4>
                  <p className="text-xs text-slate-300">Compare compensation, bonds, and company health side-by-side.</p>
                  <Link
                    href="/my-offers"
                    className="inline-block w-full text-center py-2 px-3 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Compare Saved Offers
                  </Link>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
