import React, { useState } from 'react';
import { DecisionFactor } from '@/types';
import { MessageSquare, Copy, Check, Lightbulb } from 'lucide-react';

interface NegotiationAssistantProps {
  priorities: DecisionFactor[];
}

export function NegotiationAssistant({ priorities }: NegotiationAssistantProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (priorities.length === 0) {
    return null;
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getNeutralTemplate = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('salary') || lowerTitle.includes('compensation') || lowerTitle.includes('pay')) {
      return `I am very excited about the opportunity to join the team. I was reviewing the compensation details and wanted to ask if there is any flexibility regarding the ${title.toLowerCase()} based on my experience and current market alignment.`;
    }
    if (lowerTitle.includes('bond') || lowerTitle.includes('commitment')) {
      return `I am excited about this role. However, I noticed the ${title.toLowerCase()} in the contract. Could we discuss whether this requirement can be waived, reduced in duration, or made pro-rata?`;
    }
    if (lowerTitle.includes('notice')) {
      return `Thank you again for the offer. I noticed the ${title.toLowerCase()} is set to a specific duration. Is there room to negotiate this to a more standard timeframe to align with industry practices?`;
    }
    if (lowerTitle.includes('compete')) {
      return `I am reviewing the offer terms and have a question regarding the ${title.toLowerCase()}. Could we clarify or narrow the scope of this restriction so it doesn't overly limit my future career flexibility while still protecting the company's core interests?`;
    }
    
    // Generic fallback
    return `Thank you for the offer. I was reviewing the details regarding the ${title.toLowerCase()} and wanted to discuss if there is any flexibility or room for adjustment on this point.`;
  };

  const getAdvice = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('bond')) return 'Ask whether the bond can be reduced, removed, or prorated.';
    if (lowerTitle.includes('compete')) return 'Ask to narrow the scope or duration of the non-compete.';
    if (lowerTitle.includes('notice')) return 'Ask to reduce the notice period to a standard 30 or 60 days.';
    if (lowerTitle.includes('salary') || lowerTitle.includes('pay')) return 'Ask for an adjustment based on your market research and experience.';
    return `Ask for clarification or flexibility regarding this specific term.`;
  };

  return (
    <div id="negotiate" className="scroll-mt-24 max-w-4xl mx-auto space-y-12">
      
      {/* Section 8: What Should You Negotiate? */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">What Should You Negotiate?</h2>
          <p className="text-slate-600 mt-2">
            Based on our analysis, here are the top points you should discuss with the employer.
          </p>
        </div>

        <div className="space-y-6 mt-6">
          {priorities.map((priority, idx) => (
            <div key={idx} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
              
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                  Priority {idx + 1}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{priority.title}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Why it matters</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{priority.explanation}</p>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">What to ask</h4>
                    <p className="text-sm text-slate-700">{getAdvice(priority.title)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 9: Negotiation Assistant */}
      <div className="p-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl space-y-6">
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-indigo-900">Ready to talk to HR?</h2>
          <p className="text-indigo-800/70 max-w-lg leading-relaxed text-sm">
            We&apos;ve drafted some professional, neutral talking points for your priorities. You can copy these and adapt them to your email or conversation.
          </p>
        </div>

        <div className="space-y-4 mt-4">
          {priorities.map((priority, idx) => {
            const template = getNeutralTemplate(priority.title);
            
            return (
              <div key={`draft-${idx}`} className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-xs relative group">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">
                  Draft for: {priority.title}
                </span>
                <p className="text-sm text-slate-700 italic leading-relaxed pl-3 border-l-2 border-indigo-200">
                  &quot;{template}&quot;
                </p>
                
                <button
                  onClick={() => handleCopy(template, idx)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  title="Copy to clipboard"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
