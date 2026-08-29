'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, ShieldAlert, RefreshCw } from 'lucide-react';

interface AdminOfferItem {
  id: string;
  companyName: string | null;
  status: string;
  hasFile: boolean;
  fileName: string | null;
  createdAt: string;
  userEmail: string;
  score: number | null;
}

export default function AdminOffersPage() {
  const { user, loading: authLoading } = useAuth();
  const [offers, setOffers] = useState<AdminOfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const token = await user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/admin/offers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 403) {
        setError('Your account is not on the admin list for this app.');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError('Failed to load uploaded offers.');
        setLoading(false);
        return;
      }

      const json = await res.json();
      setOffers(json.data || []);
    } catch {
      setError('Failed to load uploaded offers.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount/auth-ready
    fetchOffers();
  }, [authLoading, fetchOffers]);

  const handleViewFile = async (offerId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/admin/offers/${offerId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('This file is no longer available on the server.');
        return;
      }
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      alert('This file is no longer available on the server.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Admin · All Uploaded Offers</h1>
            <p className="text-xs text-slate-500">Every offer letter uploaded across all accounts</p>
          </div>
          <button
            onClick={fetchOffers}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </header>

        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 font-mono">
              Loading uploaded offers...
            </div>
          ) : error ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">{error}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your email to the <code className="bg-slate-100 px-1 py-0.5 rounded">ADMIN_EMAILS</code> environment variable on the backend to get access.
              </p>
            </div>
          ) : offers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No offers uploaded yet</h3>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-left text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3">Uploaded by</th>
                      <th className="px-5 py-3">Company</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3">Uploaded</th>
                      <th className="px-5 py-3">File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {offers.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-900 break-all">{o.userEmail}</td>
                        <td className="px-5 py-3 text-slate-700">{o.companyName || 'Not specified'}</td>
                        <td className="px-5 py-3 text-slate-700 capitalize">{o.status}</td>
                        <td className="px-5 py-3 font-mono text-slate-900">{o.score !== null ? `${o.score}/100` : '—'}</td>
                        <td className="px-5 py-3 text-slate-500">
                          {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3">
                          {o.hasFile ? (
                            <button
                              onClick={() => handleViewFile(o.id)}
                              className="px-3 py-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                            >
                              View PDF
                            </button>
                          ) : (
                            <span className="text-slate-400">No longer on disk</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
