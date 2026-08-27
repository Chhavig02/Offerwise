import React from 'react';
import Link from 'next/link';

interface OfferwiseLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** If set, the icon mark becomes its own link (independent of textHref). */
  iconHref?: string;
  /** If set, the "Offerwise" text becomes its own link (independent of iconHref). */
  textHref?: string;
  /** Called when either link is clicked (e.g. to close a mobile drawer). */
  onNavigate?: () => void;
}

export function OfferwiseLogo({ size = 'md', className = '', iconHref, textHref, onNavigate }: OfferwiseLogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const icon = (
    <div className={`relative ${iconSizes[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 shadow-md shadow-indigo-500/20 shrink-0 overflow-hidden`}>
      <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
        {/* Offer document with rupee, checked terms, and a "grounded evidence" magnifier */}
        <g transform="rotate(-8 46 48)">
          <rect x="22" y="14" width="44" height="60" rx="6" fill="white" />
          <path d="M55 14 L66 14 L66 25 Z" fill="#DCD3F7" />
          <text x="30" y="37" fontFamily="Arial, Helvetica, sans-serif" fontSize="17" fontWeight="700" fill="#6D28D9">₹</text>
          <rect x="30" y="45" width="26" height="3.4" rx="1.7" fill="#D6CBF5" />
          <rect x="30" y="53" width="21" height="3.4" rx="1.7" fill="#D6CBF5" />
          <rect x="30" y="61" width="24" height="3.4" rx="1.7" fill="#D6CBF5" />
          <circle cx="29" cy="69" r="6.5" fill="#6D28D9" />
          <path d="M25.7 69 L28 71.3 L32.3 66.3" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <circle cx="68" cy="68" r="17" fill="white" stroke="#312E81" strokeWidth="4.5" />
        <circle cx="62.5" cy="64.5" r="2" fill="#312E81" />
        <circle cx="73.5" cy="64.5" r="2" fill="#312E81" />
        <path d="M61.5 71 Q68 76.5 74.5 71" stroke="#312E81" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <line x1="80" y1="80" x2="90" y2="90" stroke="#312E81" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M18,15 Q19.5,20 24,21.5 Q19.5,23 18,28 Q16.5,23 12,21.5 Q16.5,20 18,15 Z" fill="white" />
        <path d="M84,30 Q86.5,37 94,39.5 Q86.5,42 84,49 Q81.5,42 74,39.5 Q81.5,37 84,30 Z" fill="#FBBF24" />
      </svg>
    </div>
  );

  const text = (
    <div className="flex flex-col leading-none">
      <span className={`font-bold tracking-tight ${textSizes[size]} bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent`}>
        Offerwise
      </span>
    </div>
  );

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Abstract "O" Logo Icon with Purple Gradient and Data Nodes */}
      {iconHref ? <Link href={iconHref} aria-label="Dashboard" onClick={onNavigate}>{icon}</Link> : icon}
      {textHref ? <Link href={textHref} aria-label="Offerwise home" onClick={onNavigate}>{text}</Link> : text}
    </div>
  );
}
