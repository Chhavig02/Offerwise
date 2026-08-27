'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  to: number;
  durationMs?: number;
  className?: string;
}

/** Counts up from 0 to `to` once, starting on mount. Respects prefers-reduced-motion. */
export function CountUp({ to, durationMs = 1200, className = '' }: CountUpProps) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let frame: number;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      frame = requestAnimationFrame(() => setValue(to));
      return () => cancelAnimationFrame(frame);
    }

    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * to));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [to, durationMs]);

  return <span className={className}>{value}</span>;
}
