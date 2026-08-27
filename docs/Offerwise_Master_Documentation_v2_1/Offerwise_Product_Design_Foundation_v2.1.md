# Offerwise — Product Design Foundation (v2.1)

## 1. Product Promise
“Know what is actually in your offer.”

Offerwise reduces uncertainty by separating:
- what the document says
- what the document does not say
- what may deserve attention
- what should be verified externally

## 2. Trust Model

### Layer 1 — Evidence
What exact text supports the fact?

### Layer 2 — Facts
What structured value was extracted?

### Layer 3 — Gaps
What important value is absent?

### Layer 4 — Rules
What deterministic condition was triggered?

### Layer 5 — Interpretation
Why does the finding matter?

### Layer 6 — Action
What could the user ask, clarify, or negotiate?

This hierarchy prevents an AI explanation from becoming an unsupported conclusion.

## 3. User Mental Model
The report should answer, in order:
1. What am I being offered?
2. What is guaranteed vs conditional?
3. What important terms constrain me?
4. What is missing?
5. What looks unusual?
6. Why does it matter?
7. What should I verify?
8. What could I negotiate?

## 4. Report Information Architecture
1. Offer snapshot
2. Compensation
3. Benefits
4. Employment terms
5. Risk flags
6. Information gaps
7. Document/evidence issues
8. Positive signals
9. Affordability
10. Offer strength
11. Negotiation opportunities
12. Term explanations
13. Sources/evidence
14. Disclaimer

## 5. Flag UX Principle
Never mix all signals into one “risk” bucket.

Use:
- Risks
- Missing information
- Document issues
- Negotiation opportunities
- Positive signals

This prevents users from interpreting “not specified” as “bad”.

## 6. Evidence Interaction
A user should be able to move from:
Flag → Reason → Evidence → Original document page.

Evidence should be concise and contextual.

## 7. Empty/Uncertain States
Examples:
- “Not specified in the uploaded offer letter.”
- “The clause was detected, but the extracted value is uncertain.”
- “This page could not be read reliably.”
- “No evidence was found for this field.”

Do not fabricate fallback values.

## 8. Comparison Philosophy
Comparison is not a single winner-takes-all number.

Show:
- compensation advantage
- flexibility advantage
- benefits advantage
- risk advantage
- affordability advantage
- information completeness

Then explain trade-offs.

## 9. Negotiation Philosophy
Negotiation suggestions must be:
- specific
- evidence-based
- respectful
- realistic
- tied to a concrete fact or gap

## 10. Legal Safety
Use “may”, “could”, “potentially”, and “consider reviewing” when legal interpretation is uncertain.

Do not claim:
- illegal
- definitely unenforceable
- legally binding outcome

unless a verified legal source and jurisdiction-specific rule supports the statement.

## 11. Trust Copy
Recommended:
“Based on your uploaded offer letter”
“Not specified in the document”
“Source: page 4”
“External estimate”
“Informational only”

Avoid:
“AI says”
“Guaranteed”
“Definitely safe”
“Definitely a scam”

## 12. Product Personality
Calm.
Precise.
Evidence-first.
Non-judgmental.
Helpful.
Never alarmist.
