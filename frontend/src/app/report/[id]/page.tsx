'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { AnalysisResult, Flag } from '@/types';
import { EvidenceDrawerPanel } from '@/components/report/EvidenceDrawerPanel';

import { StoryNavigation } from '@/components/report/StoryNavigation';
import { OfferIntroduction } from '@/components/report/OfferIntroduction';
import { PayBreakdown } from '@/components/report/PayBreakdown';
import { MarketRangeBar } from '@/components/report/MarketRangeBar';
import { CompanyStory } from '@/components/report/CompanyStory';
import { ContractTermsTimeline } from '@/components/report/ContractTermsTimeline';
import { DecisionFactorsSection } from '@/components/report/DecisionFactorsSection';
import { UnknownsChecklist } from '@/components/report/UnknownsChecklist';
import { NegotiationAssistant } from '@/components/report/NegotiationAssistant';
import { DecisionRecommendationCard } from '@/components/report/DecisionRecommendationCard';
import { DecisionBeforeAccepting } from '@/components/report/DecisionBeforeAccepting';

import { 
  ShieldAlert, 
  Download, 
  Share2, 
  ArrowLeft,
  Info
} from 'lucide-react';

export default function ReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);
  const [selectedFlagTitle, setSelectedFlagTitle] = useState<string | undefined>();
  const [downloadingOriginal, setDownloadingOriginal] = useState(false);

  const handleDownloadOriginal = async () => {
    if (!id || typeof id !== 'string' || !user) {
      alert('Please sign in to download the original offer letter.');
      return;
    }
    try {
      setDownloadingOriginal(true);
      const token = await user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/offers/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('The original offer letter could not be downloaded.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'The original offer letter could not be downloaded.');
    } finally {
      setDownloadingOriginal(false);
    }
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id || typeof id !== 'string') {
        setError('Invalid offer ID.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = user ? await user.getIdToken() : null;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        const res = await fetch(`${apiUrl}/api/offers/${id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!res.ok) {
          if (res.status === 404) {
            setError('Offer analysis report not found. It may still be processing or was deleted.');
          } else if (res.status === 401) {
            setError('Unauthorized. Please sign in to view this offer report.');
          } else {
            setError('Failed to load offer analysis report.');
          }
          setLoading(false);
          return;
        }

        const json = await res.json();
        const p = json.data;

        if (!p) {
          setError('Analysis data is unavailable.');
          setLoading(false);
          return;
        }

        const realData: AnalysisResult = {
          offer_id: p.offerId || id,
          user_id: user?.uid || '',
          score: p.score,
          summary: p.summary || 'Automated analysis completed.',
          flags: p.flags || [],
          information_gaps: p.informationGaps || [],
          positive_signals: p.positiveSignals || [],
          negotiation_points: p.flags ? p.flags.map((f: Flag) => f.title) : [],
          extraction_version: p.extractionVersion || '1.0',
          rules_version: p.rulesVersion || '1.0',
          evidence_flags: [],
          scam_score: 0,
          affordability: null,
          created_at: p.createdAt || new Date().toISOString(),
          extracted_data: p.extractedData || {},
          company_research: p.companyResearch ?? { status: 'unavailable', reason: 'company_name_unverified' },
          comparison: p.comparison ?? {
            status: 'unavailable',
            insights: [],
            comparedFields: [],
            limitations: ['Market comparison data unavailable.']
          },
          decision: p.decision || undefined
        };

        setAnalysis(realData);
      } catch (err) {
        console.error('Fetch analysis error:', err);
        setError('Unable to connect to the backend service.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchAnalysis();
    }
  }, [id, user, authLoading]);

  const openEvidenceFor = (title: string) => {
    setSelectedFlagTitle(title);
    setShowEvidenceDrawer(true);
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500 font-mono">Loading offer analysis report...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 lg:pl-64 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-600 mb-4 max-w-md">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-bold">{error || 'Report unavailable'}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const ext = analysis.extracted_data;

  // Salary calculations
  const fixed = ext?.fixedSalary?.value !== null && ext?.fixedSalary?.status === 'found' ? ext.fixedSalary.value : null;
  const variable = ext?.variableSalary?.value !== null && ext?.variableSalary?.status === 'found' ? ext.variableSalary.value : null;
  const currencySymbol = ext?.currency?.value && ext?.currency?.status === 'found' ? (ext.currency.value === 'USD' ? '$' : '₹') : '₹';
  
  // Total Annual Compensation
  const annualTotalComp = (fixed !== null || variable !== null) ? ((fixed || 0) + (variable || 0)) : null;

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Offerwise Report
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadOriginal}
              disabled={downloadingOriginal}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">{downloadingOriginal ? 'Opening…' : 'Original PDF'}</span>
            </button>
            <button
              onClick={() => alert('Private share link copied to clipboard')}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </header>

        <StoryNavigation />

        <main className="px-8 py-10 md:py-14 max-w-[960px] mx-auto w-full space-y-8">

          <OfferIntroduction ext={ext} annualTotalComp={annualTotalComp} currencySymbol={currencySymbol} />

          <div className="w-full h-px bg-slate-100 max-w-xl mx-auto" />

          <PayBreakdown ext={ext} annualTotalComp={annualTotalComp} currencySymbol={currencySymbol} />

          <div className="w-full h-px bg-slate-100 max-w-xl mx-auto" />

          {/* Section 3: Market */}
          <div id="market" className="scroll-mt-24 max-w-4xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">How Does Your Pay Compare With The Market?</h2>
              <p className="text-slate-600 mt-2">
                We checked Adzuna to see how your base salary measures up against similar roles.
              </p>
            </div>

            {analysis.comparison?.marketCompensation ? (
              <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
                <MarketRangeBar
                  yourOffer={fixed || 0}
                  minRange={analysis.comparison.marketCompensation.minimum || 0}
                  medianRange={analysis.comparison.marketCompensation.median || 0}
                  maxRange={analysis.comparison.marketCompensation.maximum || 0}
                  currency={currencySymbol}
                  sourceText={analysis.comparison.marketCompensation.source.title || 'Adzuna Benchmark'}
                  retrievedDate={new Date(analysis.comparison.marketCompensation.retrievedAt).toLocaleDateString()}
                />
              </div>
            ) : (
              <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col items-center text-center gap-3">
                <Info className="w-8 h-8 text-slate-400" />
                <p className="text-slate-700 font-medium text-lg">Market comparison isn&apos;t available for this offer yet.</p>
                <p className="text-sm text-slate-500 max-w-lg">
                  {analysis.comparison?.limitations.join(' ') || 'We couldn&apos;t find a reliable benchmark for this specific role and location combination.'} This does not negatively affect your offer score.
                </p>
              </div>
            )}
          </div>

          <div className="w-full h-px bg-slate-100 max-w-xl mx-auto" />

          <CompanyStory research={analysis.company_research} offerId={analysis.offer_id} />

          <div className="w-full h-px bg-slate-100 max-w-xl mx-auto" />

          <ContractTermsTimeline ext={ext} onOpenEvidence={openEvidenceFor} />

          <div className="w-full h-px bg-slate-100 max-w-xl mx-auto" />

          {analysis.decision ? (
            <>
              <DecisionFactorsSection concerns={analysis.decision.concerns} onOpenEvidence={openEvidenceFor} />
              
              <div className="w-full h-px bg-slate-100 max-w-xl mx-auto" />

              <UnknownsChecklist beforeAccepting={analysis.decision.beforeAccepting} />

              <div className="w-full h-px bg-slate-100 max-w-xl mx-auto" />

              <NegotiationAssistant priorities={analysis.decision.negotiationPriorities} />

              <div className="w-full h-px bg-slate-100 max-w-xl mx-auto" />

              <DecisionRecommendationCard decision={analysis.decision} />

              <div className="w-full h-px bg-slate-100 max-w-xl mx-auto" />

              <DecisionBeforeAccepting items={analysis.decision.beforeAccepting} />
            </>
          ) : (
            <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-3xl flex flex-col items-center text-center gap-3">
              <Info className="w-8 h-8 text-indigo-400" />
              <p className="text-indigo-900 font-medium text-lg">Your detailed decision assessment isn&apos;t available for this analysis yet.</p>
              <p className="text-sm text-indigo-700 max-w-lg">
                Please re-run the offer analysis to generate the negotiation recommendations and final decision story.
              </p>
            </div>
          )}

        </main>
      </div>

      <EvidenceDrawerPanel
        isOpen={showEvidenceDrawer}
        onClose={() => setShowEvidenceDrawer(false)}
        selectedFlagTitle={selectedFlagTitle}
        flags={analysis.flags}
      />
    </div>
  );
}
