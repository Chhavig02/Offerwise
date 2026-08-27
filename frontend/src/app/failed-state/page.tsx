'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function FailedAnalysisPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
          <h1 className="text-xl font-extrabold text-slate-900">Analysis Status</h1>
        </header>

        <main className="p-6 md:p-12 max-w-xl w-full mx-auto my-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
            
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Analysis couldn&apos;t be completed</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                We couldn&apos;t find enough verifiable compensation or employment terms in the submitted document.
              </p>
            </div>

            {/* Diagnostic checklist */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 text-xs text-slate-600">
              <span className="font-bold text-slate-800 block">Common reasons:</span>
              <ul className="list-disc pl-5 space-y-1 text-slate-500">
                <li>The PDF is password-protected or encrypted.</li>
                <li>The uploaded file is an image scan without selectable text.</li>
                <li>The document is a general job description instead of a formal offer/appointment letter.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => router.push('/upload')}
                className="w-full py-3 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Analysis</span>
              </button>
              <Link
                href="/dashboard"
                className="w-full py-3 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
              >
                Back to Dashboard
              </Link>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
