'use client';

import React from 'react';
import Link from 'next/link';
import { OfferwiseLogo } from '../ui/OfferwiseLogo';

interface NavbarProps {
  darkTheme?: boolean;
}

export function Navbar({ darkTheme = true }: NavbarProps) {
  return (
    <header className={`w-full py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-40 transition-colors ${
      darkTheme ? 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 text-white' : 'bg-white/80 backdrop-blur-md border-b border-slate-200 text-slate-900'
    }`}>
      <Link href="/" className="flex items-center gap-2">
        <OfferwiseLogo />
      </Link>

      <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
        <Link href="#how-it-works" className={`${darkTheme ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
          How It Works
        </Link>
        <Link href="#features" className={`${darkTheme ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
          Features
        </Link>
        <Link href="#trust" className={`${darkTheme ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
          Evidence Engine
        </Link>
        <Link href="#pricing" className={`${darkTheme ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
          Pricing
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <Link 
          href="/login" 
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            darkTheme ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-lg shadow-sm shadow-orange-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}
