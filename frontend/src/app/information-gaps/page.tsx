'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Flag } from '@/types';
import { HelpCircle, Copy, Check, MessageSquare, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

function InformationGapsContent() {
  const searchParams = useSearchParams();
  const offerIdParam = searchParams ? searchParams.get('offerId') : null;
  const { user } = useAuth();

  const [gaps, setGaps] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchInformationGaps = async () => {
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
            // Raw shape returned by GET /api/offers/:id (matches the Prisma
            // OfferAnalysis record) -- camelCase, not the snake_case AnalysisResult shape.
            const analysis: { informationGaps?: Flag[] } | null = json.data;
            if (analysis && analysis.informationGaps) {
              setGaps(analysis.informationGaps);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch information gaps:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInformationGaps();
  }, [user, offerIdParam]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getClarificationQuestion = (gap: Flag) => {
    const title = gap.title.toLowerCase();
    if (title.includes('insurance') || title.includes('health')) {
      return 'Could you kindly share details on the health insurance coverage policy, sum insured amount, and family dependent inclusion options?';
    }
    if (title.includes('relocation')) {
      return 'Could you please clarify whether relocation reimbursement or temporary accommodation support is provided?';
    }
    if (title.includes('notice')) {
      return 'Could you please confirm the required notice period during probation versus post-confirmation?';
    }
    if (title.includes('probation')) {
      return 'Could you confirm the formal duration of the probation period and whether confirmation is automatic or requires written review?';
    }
    if (title.includes('variable') || title.includes('bonus')) {
      return 'Could you please share the performance evaluation metrics and payout frequency for the variable component?';
    }
    return `Could you please provide written clarification regarding ${gap.title.toLowerCase()} for complete records?`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
          <h1 className="text-xl font-extrabold text-slate-900">Information Gaps & Clarifications</h1>
          <p className="text-xs text-slate-500">Absent details in your offer letter are highlighted here to ask your employer</p>
        </header>

        <main className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-8">
          
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-slate-700 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 font-bold block mb-0.5">Core Product Invariant: Information gap ≠ Negative fact.</strong>
              An absent field (e.g. missing insurance policy details) is shown as <em>&quot;Not specified&quot;</em> and never penalizes your score as a risk. Use the pre-drafted clarification questions below to confirm with HR.
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs font-mono text-slate-500">
              Checking information gaps from offer analysis...
            </div>
          ) : gaps.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 max-w-xl mx-auto my-8">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No information gaps identified</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your analyzed offer letter contains comprehensive contractual coverage without missing material terms.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {gaps.map((item, idx) => {
                const question = getClarificationQuestion(item);
                return (
                  <div key={item.id || idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Not specified in document
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {item.reason}
                    </p>

                    {/* Pre-drafted Email Question */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-1.5 text-indigo-600">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Suggested Employer Clarification Wording
                        </span>
                        <button
                          onClick={() => handleCopy(question, idx)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied Wording</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Wording</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono leading-relaxed">
                        &quot;{question}&quot;
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default function InformationGapsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-xs text-slate-500">
        Loading information gaps...
      </div>
    }>
      <InformationGapsContent />
    </Suspense>
  );
}
