'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { OfferwiseLogo } from '@/components/ui/OfferwiseLogo';
import {
  FileSearch,
  Building2,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Scale
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Navbar */}
      <Navbar darkTheme={true} />

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-6 md:px-12 overflow-hidden border-b border-slate-800/60">
        {/* Glow Radial Background Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-orange-900/35 via-red-900/20 to-amber-900/10 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-orange-500/10 border border-orange-500/20 text-orange-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Evidence-Grounded AI Offer Intelligence</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Understand your offer. <br />
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Make the right career move.
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-xl">
              Offerwise analyzes your job offer, company intelligence, market compensation, and employment risks so you can decide with confidence.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/signup"
                className="px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Analyze My Offer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="px-6 py-3.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/40 rounded-xl transition-colors text-center"
              >
                See How It Works
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>100% Document Privacy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
                <span>Grounded Evidence Only</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-red-400" />
                <span>No Hallucinated Data</span>
              </div>
            </div>
          </div>

          {/* Right Product Interactive Mockup (Reference Inspired) */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none glass-panel-dark rounded-2xl p-6 shadow-2xl border border-slate-700/60 glow-warm">
              
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] font-mono text-slate-400">sample_offer_analysis.pdf</span>
              </div>
              <div className="flex justify-center pt-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                  Illustrative example — not a real analysis
                </span>
              </div>

              {/* Main Card Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                
                {/* Score Column */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Overall Offer Score</span>
                  <div className="relative w-24 h-24 flex items-center justify-center my-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
                      <circle cx="50" cy="50" r="42" stroke="#10B981" strokeWidth="8" strokeDasharray="264" strokeDashoffset="47" strokeLinecap="round" fill="transparent" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-extrabold text-white font-mono">82</span>
                      <span className="text-[9px] text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Strong Offer
                  </span>
                </div>

                {/* Score Factors */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs font-medium">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Score factors</span>
                  <div className="flex justify-between text-slate-300">
                    <span>Compensation</span>
                    <span className="text-emerald-400 font-mono font-bold">+25</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Benefits</span>
                    <span className="text-emerald-400 font-mono font-bold">+10</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Role & Growth</span>
                    <span className="text-emerald-400 font-mono font-bold">+15</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Risks & Bonds</span>
                    <span className="text-rose-400 font-mono font-bold">-15</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Market Alignment</span>
                    <span className="text-amber-400 font-mono font-bold">+8</span>
                  </div>
                </div>

              </div>

              {/* Company Signals & Market Preview Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                
                {/* Company Signals */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Signals</span>
                  <div className="flex justify-between text-slate-300">
                    <span>Hiring activity</span>
                    <span className="text-emerald-400 font-semibold">High</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Company growth</span>
                    <span className="text-emerald-400 font-semibold">Positive</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Recent funding</span>
                    <span className="text-emerald-400 font-semibold">Positive</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Restructuring</span>
                    <span className="text-amber-400 font-semibold">Watch</span>
                  </div>
                </div>

                {/* Market Position Bar Preview */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Market Position</span>
                    <div className="flex justify-between font-mono text-[11px] text-slate-300">
                      <span>₹10L</span>
                      <span className="text-orange-300 font-bold">Your: ₹12L</span>
                      <span>₹20L</span>
                    </div>
                  </div>

                  <div className="h-2 bg-slate-800 rounded-full w-full relative my-2">
                    <div className="absolute top-0 bottom-0 left-0 w-3/5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
                    <div className="absolute top-1/2 left-2/5 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-orange-600 shadow-xs" />
                  </div>

                  <span className="text-[10px] text-center text-slate-400 font-mono">
                    Market Median: ₹18.8 LPA
                  </span>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Trust Logos */}
      <section className="py-8 bg-slate-900/50 border-b border-slate-800 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
            Trusted by candidates negotiating offers at leading technology firms
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 font-bold text-lg tracking-tight text-slate-300">
            <span>Google</span>
            <span>Microsoft</span>
            <span>Amazon</span>
            <span>TCS</span>
            <span>Infosys</span>
            <span>Flipkart</span>
          </div>
        </div>
      </section>

      {/* How Offerwise Works (5 Step Process) */}
      <section id="how-it-works" className="py-20 px-6 md:px-12 bg-slate-950 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Step-by-step intelligence</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">How Offerwise works</h2>
            <p className="text-sm text-slate-400">Five automated steps to turn dense employment legal contracts into transparent career intelligence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Upload your offer', desc: 'Securely submit your PDF or DOCX offer letter.', icon: FileSearch, badge: 'bg-orange-600/20 text-orange-400', hover: 'hover:border-orange-500/40' },
              { step: '2', title: 'Extract key terms', desc: 'AI parses CTC, fixed pay, bonds & clauses.', icon: Scale, badge: 'bg-red-600/20 text-red-400', hover: 'hover:border-red-500/40' },
              { step: '3', title: 'Verify evidence', desc: 'Every claim is validated against raw text.', icon: ShieldCheck, badge: 'bg-amber-600/20 text-amber-400', hover: 'hover:border-amber-500/40' },
              { step: '4', title: 'Research company', desc: 'Live web signals check stability & growth.', icon: Building2, badge: 'bg-orange-600/20 text-orange-400', hover: 'hover:border-orange-500/40' },
              { step: '5', title: 'Compare market', desc: 'Benchmark pay against verified salary distributions.', icon: TrendingUp, badge: 'bg-red-600/20 text-red-400', hover: 'hover:border-red-500/40' }
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className={`bg-slate-900/60 border border-slate-800 rounded-xl p-5 relative space-y-3 flex flex-col justify-between transition-colors ${s.hover}`}>
                  <div className="flex items-center justify-between">
                    <span className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center ${s.badge}`}>
                      0{s.step}
                    </span>
                    <Icon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{s.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="py-20 px-6 md:px-12 bg-slate-900/30 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Core Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Built like financial software, for your career</h2>
            <p className="text-sm text-slate-400">No guesswork. Every feature is designed to protect your interests during offer negotiation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-orange-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Risk & Bond Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically identifies 2-year training bonds, penalty clauses, non-competes, extended notice periods, and variable pay traps.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-red-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Company Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Researches employer web signals to alert you about recent layoffs, funding rounds, corporate restructuring, or lawsuit history.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-amber-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Market Benchmarking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compares your fixed compensation against verified role & location salary distributions so you know if you are being underpaid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Scoring Section */}
      <section id="trust" className="py-20 px-6 md:px-12 bg-slate-950">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-slate-900 via-orange-950/30 to-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Zero Hallucinations</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Missing information is never treated as a negative fact.</h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              If an offer letter doesn&apos;t mention health insurance or notice periods, Offerwise marks it clearly as an <strong>Information Gap</strong>—not a penalizing risk.
            </p>
          </div>
          <Link
            href="/signup"
            className="px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl shadow-lg shadow-orange-600/30 transition-all shrink-0"
          >
            Analyze My Offer Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-12 px-6 md:px-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <OfferwiseLogo size="sm" />
          <p>© 2026 Offerwise. Informational analysis only. Does not constitute binding legal advice.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300">Sign in</Link>
            <Link href="/signup" className="hover:text-slate-300">Sign up</Link>
            <Link href="#privacy" className="hover:text-slate-300">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
