'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyResearchOutcome, NormalizedOfferData, CompanySignal } from '@/types';
import { ExternalLink, Info, AlertTriangle, HelpCircle, ShieldCheck, Link2 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function CompanyIntelligenceContent() {
  const searchParams = useSearchParams();
  const offerIdParam = searchParams ? searchParams.get('offerId') : null;
  const { user } = useAuth();
  const [research, setResearch] = useState<CompanyResearchOutcome | null>(null);
  const [extractedData, setExtractedData] = useState<NormalizedOfferData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
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
              setResearch(json.data.companyResearch || { status: 'unavailable', reason: 'company_name_unverified' });
              setExtractedData(json.data.extractedData || null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch company intelligence:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [user, offerIdParam]);

  const isAvailable = research?.status === 'available';
  const result = isAvailable ? research.result : null;
  const employerName = extractedData?.companyName?.value || 'the employer';
  const roleName = extractedData?.role?.value || 'the role';
  const locationName = extractedData?.location?.value;

  const hasBond = extractedData?.hasBond?.value === true;
  const hasNonCompete = extractedData?.hasNonCompete?.value === true;

  // Helper functions for dynamic content
  const getSignalTitle = (type: string) => {
    switch (type) {
      case 'layoffs': return 'Layoffs or Downsizing Signal Detected';
      case 'restructuring': return 'Restructuring Signal Detected';
      case 'funding': return 'Funding Activity Detected';
      case 'acquisition': return 'Merger or Acquisition Signal Detected';
      case 'legal': return 'Legal or Regulatory Signal Detected';
      case 'hiring': return 'Hiring Growth Detected';
      case 'company_status': return 'Company Status Update';
      default: return 'Company Signal Detected';
    }
  };

  const getSignalMeaning = (signal: CompanySignal) => {
    switch (signal.type) {
      case 'layoffs':
      case 'restructuring':
        return `This may indicate organizational change, which could affect team structures, priorities, or role stability. Because the available source indicates ${signal.type === 'layoffs' ? 'layoffs' : 'restructuring'}, it is worth verifying whether this information applies to the specific team or location you are joining.`;
      case 'funding':
      case 'hiring':
      case 'company_status':
        return `This could indicate growth, increased investment, or stability. Positive signals may suggest new opportunities or expanding teams, but you should verify if this momentum applies to your specific department.`;
      case 'acquisition':
        return `An acquisition or merger could lead to changes in leadership, policies, or team structure over the coming months.`;
      case 'legal':
        return `Legal or regulatory news may indicate potential financial or operational challenges. It is worth understanding if this impacts the company's long-term stability in your region.`;
      default:
        return `This signal provides context about the company's recent activities.`;
    }
  };

  const getSignalQuestions = (signal: CompanySignal) => {
    switch (signal.type) {
      case 'layoffs':
      case 'restructuring':
        return [
          "Is the team I'm joining currently affected by any restructuring?",
          "Is my role part of a new or existing team?",
          "How is the team expected to change over the next 6–12 months?"
        ];
      case 'funding':
      case 'hiring':
        return [
          "How is the recent funding/growth expected to impact the team I'm joining?",
          "Are there specific growth targets for this department?"
        ];
      case 'acquisition':
        return [
          "Will the recent acquisition change the reporting structure for my role?",
          "Are there any planned changes to employee benefits following the acquisition?"
        ];
      default:
        return [];
    }
  };

  const getIdentityQuestions = () => {
    if (result?.companyIdentityConfidence === 'low') {
      return [
        "Can you confirm the company's legal entity name and official website?",
        "Which legal entity will appear on my employment agreement?"
      ];
    }
    return [];
  };

  // Compile all questions
  const allQuestions = [
    ...getIdentityQuestions(),
    ...(result?.signals || []).flatMap(s => getSignalQuestions(s))
  ];
  const uniqueQuestions = Array.from(new Set(allQuestions));

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
          {offerIdParam && (
            <Link 
              href={`/report/${offerIdParam}`}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
            >
              ← Back to Offer Report
            </Link>
          )}
        </header>

        <main className="px-6 py-12 md:px-12 md:py-16 max-w-3xl w-full mx-auto space-y-12">
          
          {loading ? (
             <div className="flex justify-center py-12">
               <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
             </div>
          ) : isAvailable && result ? (
            <>
              {/* 1. Hero */}
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Who are you joining?</h1>
                <p className="text-slate-600 text-sm">Here&apos;s what we found about the company behind your offer.</p>
                
                <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-6 mt-4 pt-6 pb-2 border-y border-slate-100 w-full justify-center">
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Employer</span>
                    <span className="text-sm font-bold text-slate-900">{employerName}</span>
                  </div>
                  {locationName && (
                    <>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <div className="text-center sm:text-left">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Location</span>
                        <span className="text-sm font-bold text-slate-900">{locationName}</span>
                      </div>
                    </>
                  )}
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Role</span>
                    <span className="text-sm font-bold text-slate-900">{roleName}</span>
                  </div>
                </div>
              </div>

              {/* 2. Identity Check */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 px-2">First, let&apos;s verify the company</h2>
                
                {result.companyIdentityConfidence === 'high' ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                        Offerwise found strong evidence that the researched company matches the employer named in your offer.
                      </p>
                      <div className="mt-2 text-xs text-emerald-700/80 break-words">
                        Matches: {result.officialWebsite || result.companyName}
                      </div>
                    </div>
                  </div>
                ) : result.companyIdentityConfidence === 'medium' ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-amber-900 font-medium leading-relaxed">
                        We found a likely match, but some company details could not be independently confirmed.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 md:p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                      </div>
                      <div className="space-y-3 min-w-0">
                        <h3 className="font-bold text-amber-900">Company identity needs verification</h3>
                        <p className="text-sm text-amber-800 leading-relaxed">
                          We found company information that may not confidently match the employer in your offer. Treat company-specific findings cautiously and verify the employer&apos;s official details before relying on them.
                        </p>
                        
                        <div className="bg-white/60 rounded-xl p-4 text-xs space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 border-b border-amber-100 pb-3">
                            <span className="text-amber-700/70 font-semibold shrink-0">Offer states:</span>
                            <span className="font-bold text-amber-900 break-words sm:text-right">{employerName}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5">
                            <span className="text-amber-700/70 font-semibold shrink-0">Research found:</span>
                            <div className="sm:text-right min-w-0">
                              <span className="font-bold text-amber-900 block break-words">{result.companyName}</span>
                              {result.officialWebsite && (
                                <span className="text-[10px] text-amber-700 block break-all">{result.officialWebsite}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs font-bold text-amber-900 pt-2">
                          Verify the employer&apos;s official website and legal name before making decisions based on company research.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3 & 4. What did we find? (Signals) */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 px-2">What did we find?</h2>
                
                {result.signals.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600 italic">
                    We didn&apos;t find any major web signals (like restructuring, funding, or legal news) that require your immediate attention.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {result.signals.map((sig, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
                        <h3 className="text-base font-bold text-slate-900">{getSignalTitle(sig.type)}</h3>
                        
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">What we found</h4>
                          <p className="text-sm text-slate-700 leading-relaxed">{sig.summary}</p>
                        </div>
                        
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" /> What this could mean for you
                          </h4>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {getSignalMeaning(sig)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Offer Context */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 px-2">Why does this matter for your offer?</h2>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                  {result.signals.some(s => ['layoffs', 'restructuring'].includes(s.type)) && (hasBond || hasNonCompete) ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        If your offer includes a long training bond or significant repayment obligation, and company research contains an uncertain restructuring signal, it may be worth clarifying what happens to the bond if the company terminates your role or restructures your team.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      No company-specific signal currently changes the interpretation of your offer terms. You can review the contractual terms and compensation separately.
                    </p>
                  )}
                </div>
              </div>

              {/* 6. Questions */}
              {uniqueQuestions.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 px-2">Questions worth asking before you join</h2>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 md:p-8 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                        <HelpCircle className="w-5 h-5 text-indigo-600" />
                      </div>
                      <p className="text-sm font-bold text-indigo-900">Consider discussing these points during negotiation or final interviews:</p>
                    </div>
                    <ul className="space-y-3 pl-11">
                      {uniqueQuestions.map((q, i) => (
                        <li key={i} className="text-sm text-indigo-900/80 font-medium leading-relaxed list-disc">{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 7. Confidence & Sources */}
              <div className="mt-12 pt-12 border-t border-slate-200 space-y-6">
                <h2 className="text-base font-bold text-slate-900 text-center">How confident should you be in this research?</h2>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-600 leading-relaxed text-center max-w-xl mx-auto">
                  Company research is based on <strong>{result.sources.length}</strong> available source{result.sources.length !== 1 ? 's' : ''} processed on <strong>{new Date(result.researchedAt).toLocaleDateString()}</strong>. 
                  {result.companyIdentityConfidence === 'low' && (
                    <> Because the company identity match is low confidence, treat company-specific findings as signals to verify rather than confirmed facts.</>
                  )}
                </div>

                {/* 8. Sources View */}
                {result.sources.length > 0 && (
                  <div className="space-y-3 max-w-xl mx-auto">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Available Sources</h3>
                    <div className="grid gap-2">
                      {result.sources.map(src => (
                        <a key={src.id} href={src.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-colors group">
                          <div className="truncate pr-4 flex items-center gap-2">
                            <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs font-medium text-slate-700 truncate">{src.title}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* 8. Empty State */
            <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 text-center space-y-6 max-w-xl mx-auto my-8">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                <Info className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                We couldn&apos;t find enough reliable company information for this offer.
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  This doesn&apos;t mean anything negative about the company. It simply means Offerwise doesn&apos;t have enough verified evidence to assess it.
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-700">
                    Before accepting, verify the employer&apos;s legal name, official website, and the entity mentioned in your employment agreement.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default function CompanyIntelligencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-xs text-slate-500">
        Loading company intelligence...
      </div>
    }>
      <CompanyIntelligenceContent />
    </Suspense>
  );
}
