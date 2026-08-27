'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { UploadArea } from '@/components/UploadArea';
import { Lock } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();

  const handleUploadSuccess = (offerId: string) => {
    // Navigate directly to the real report URL returned by the backend
    router.push(`/report/${offerId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
          <h1 className="text-xl font-extrabold text-slate-900">Upload Offer Letter</h1>
          <p className="text-xs text-slate-500">Securely analyze your job offer, terms, and compensation</p>
        </header>

        <main className="p-6 md:p-10 max-w-3xl w-full mx-auto space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <UploadArea onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Privacy Guarantee Note */}
          <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
            <Lock className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>
              <strong>Your document is securely processed.</strong> Documents are kept private to your account and never used to train third-party public AI models.
            </span>
          </div>

        </main>
      </div>
    </div>
  );
}
