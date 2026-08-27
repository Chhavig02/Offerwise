'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, Info } from 'lucide-react';

interface OfferItem {
  id: string;
  company: string;
  role: string;
  location: string;
  date: string;
  status: string;
  score: number | null;
  label: string;
  bg: string;
}

export default function MyOffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) {
        setLoading(false);
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
          const mapped: OfferItem[] = rawData.map((item: any) => {
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
              location: extracted?.location?.value || 'Not specified',
              date: new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              status: item.status,
              score,
              label,
              bg
            };
          });
          setOffers(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch user offers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [user]);

  const filtered = offers.filter(o => {
    const matchesSearch = o.company.toLowerCase().includes(search.toLowerCase()) ||
                          o.role.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'strong' && o.score !== null && o.score >= 80);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">My Offers & Analysis History</h1>
            <p className="text-xs text-slate-500">Manage and compare all your analyzed job offers</p>
          </div>

          <Link
            href="/upload"
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Offer</span>
          </Link>
        </header>

        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company or role..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Filter:</span>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  filter === 'all' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Offers ({offers.length})
              </button>
              <button
                onClick={() => setFilter('strong')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  filter === 'strong' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Strong Offers Only
              </button>
            </div>
          </div>

          {/* Offers Table / Cards */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 font-mono">
              Loading your offer analysis history...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <Info className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No saved offer analyses found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your first offer letter to analyze compensation, terms, and market alignment.
              </p>
              <div className="pt-2">
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Analyze Your First Offer</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {filtered.map(offer => (
                  <div
                    key={offer.id}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-extrabold text-lg flex items-center justify-center shadow-xs shrink-0">
                        {offer.company !== 'Not specified' ? offer.company[0].toUpperCase() : '?'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{offer.company}</h3>
                        <p className="text-xs text-slate-500">
                          {offer.role} • {offer.location} • {offer.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900 font-mono block">
                          {offer.score !== null ? `${offer.score}/100` : '—'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${offer.bg}`}>
                          {offer.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/report/${offer.id}`}
                          className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-xs"
                        >
                          View Report
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
