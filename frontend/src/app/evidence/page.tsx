'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Flag, CompanyResearchOutcome, OfferComparisonResult } from '@/types';

// Raw shape returned by GET /api/offers/:id (matches the Prisma OfferAnalysis
// record) -- camelCase, not the snake_case AnalysisResult shape.
interface RawOfferAnalysis {
  createdAt?: string;
  flags?: Flag[];
  companyResearch?: CompanyResearchOutcome;
  comparison?: OfferComparisonResult;
}
import { FileText, Building2, TrendingUp, ExternalLink, CheckCircle2, Search, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface RealEvidenceItem {
  id: string;
  category: 'offer_letter' | 'company' | 'market';
  title: string;
  claim: string;
  sourceText?: string;
  sourcePage?: number | null;
  publisher: string;
  sourceUrl?: string;
  confidence: string;
  date: string;
}

function EvidenceContent() {
  const searchParams = useSearchParams();
  const offerIdParam = searchParams ? searchParams.get('offerId') : null;
  const { user } = useAuth();
  
  const [evidenceItems, setEvidenceItems] = useState<RealEvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'offer_letter' | 'company' | 'market'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEvidence = async () => {
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
            const analysis: RawOfferAnalysis | null = json.data;
            if (analysis) {
              const items: RealEvidenceItem[] = [];

              // 1. Contractual Risk Evidence
              if (analysis.flags) {
                analysis.flags.forEach((flag, idx) => {
                  if (flag.evidence && flag.evidence.length > 0) {
                    flag.evidence.forEach((ev, evIdx) => {
                      items.push({
                        id: `flag-${idx}-${evIdx}`,
                        category: 'offer_letter',
                        title: flag.title,
                        claim: flag.reason,
                        sourceText: ev.sourceText || undefined,
                        sourcePage: ev.sourcePage,
                        publisher: 'Uploaded Offer Letter Document',
                        confidence: flag.severity === 'critical' || flag.severity === 'high' ? 'high' : 'medium',
                        date: new Date(analysis.createdAt || Date.now()).toLocaleDateString()
                      });
                    });
                  }
                });
              }

              // 2. Company Research Evidence
              if (analysis.companyResearch?.status === 'available' && analysis.companyResearch.result) {
                const res = analysis.companyResearch.result;
                res.sources.forEach((src) => {
                  items.push({
                    id: `comp-src-${src.id}`,
                    category: 'company',
                    title: `Company Source: ${src.title}`,
                    claim: `Web evidence for ${res.companyName}`,
                    publisher: src.sourceType === 'official' ? 'Official Employer Web Property' : 'Verified Business News',
                    sourceUrl: src.url,
                    confidence: res.companyIdentityConfidence,
                    date: new Date(src.retrievedAt).toLocaleDateString()
                  });
                });
              }

              // 3. Market Benchmark Evidence
              if (analysis.comparison?.marketCompensation) {
                const m = analysis.comparison.marketCompensation;
                const minStr = m.minimum !== undefined ? `${m.currency}${m.minimum.toLocaleString()}` : 'N/A';
                const maxStr = m.maximum !== undefined ? `${m.currency}${m.maximum.toLocaleString()}` : 'N/A';
                const medStr = m.median !== undefined ? `${m.currency}${m.median.toLocaleString()}` : 'N/A';
                items.push({
                  id: 'market-benchmark-1',
                  category: 'market',
                  title: 'Market Salary Benchmark Distribution',
                  claim: `Salary Range: ${minStr} - ${maxStr} (Median: ${medStr})`,
                  publisher: m.source?.title || 'Adzuna Market Compensation Index',
                  sourceUrl: m.source?.url || undefined,
                  confidence: 'medium',
                  date: new Date(m.retrievedAt).toLocaleDateString()
                });
              }

              setEvidenceItems(items);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch evidence data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvidence();
  }, [user, offerIdParam]);

  const filtered = evidenceItems.filter(e => {
    const matchesTab = activeTab === 'all' || e.category === activeTab;
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.claim.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Evidence & Grounded Sources Hub</h1>
            <p className="text-xs text-slate-500">Every single risk, score addition, or fact is traceable to evidence</p>
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search evidence..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-6 rounded-2xl shadow-xs gap-4">
            {[
              { id: 'all', label: `All Sources (${evidenceItems.length})` },
              { id: 'offer_letter', label: 'Offer Letter' },
              { id: 'company', label: 'Company Intelligence' },
              { id: 'market', label: 'Market Data' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-2 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Evidence Grid */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs font-mono text-slate-500">
              Loading grounded evidence records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 max-w-xl mx-auto my-8">
              <Info className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No grounded evidence records found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload an offer letter to inspect grounded evidence snippets and verified source citations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(item => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      {item.category === 'offer_letter' && <FileText className="w-4 h-4 text-indigo-600" />}
                      {item.category === 'company' && <Building2 className="w-4 h-4 text-purple-600" />}
                      {item.category === 'market' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                      <span>{item.title}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {item.confidence} confidence
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800">{item.claim}</p>

                  {item.sourceText && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono italic text-slate-700 leading-relaxed">
                      {item.sourceText}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>
                      Publisher: <strong>{item.publisher}</strong>
                      {item.sourcePage && ` • Page ${item.sourcePage}`}
                    </span>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default function EvidencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-xs text-slate-500">
        Loading evidence hub...
      </div>
    }>
      <EvidenceContent />
    </Suspense>
  );
}
