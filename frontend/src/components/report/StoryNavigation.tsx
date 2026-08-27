import React, { useState, useEffect } from 'react';

const sections = [
  { id: 'intro', label: '1. Offer' },
  { id: 'pay', label: '2. Pay' },
  { id: 'market', label: '3. Market' },
  { id: 'company', label: '4. Company' },
  { id: 'contract', label: '5. Contract' },
  { id: 'concerns', label: '6. Concerns' },
  { id: 'negotiate', label: '7. Negotiate' },
  { id: 'decision', label: '8. Decision' }
];

export function StoryNavigation() {
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    const handleScroll = () => {
      let current = '';
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            current = section.id;
          }
        }
      }
      if (current && current !== activeSection) {
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 py-3 px-4 shadow-sm w-full overflow-x-auto">
      <div className="flex items-center gap-6 max-w-7xl mx-auto min-w-max">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollTo(section.id)}
            className={`text-xs font-bold whitespace-nowrap transition-colors ${
              activeSection === section.id
                ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
}
