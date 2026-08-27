export function classifyDocument(text: string): boolean {
  // A rapid heuristic check to reject obvious junk (like restaurant menus or random screenshots)
  // before sending to the expensive LLM.
  const lowerText = text.toLowerCase();
  
  const keywords = [
    'offer', 'employment', 'salary', 'compensation', 'joining',
    'appointment', 'contract', 'probation', 'notice period',
    'ctc', 'benefits', 'remuneration', 'annual', 'base pay'
  ];

  let matches = 0;
  for (const word of keywords) {
    if (lowerText.includes(word)) {
      matches++;
    }
  }

  // If it has at least 2 relevant keywords, we classify it as an offer letter candidate.
  return matches >= 2;
}
