# Offerwise — Product Requirements Document (v2.1)

## 1. Executive Summary
Offerwise is an evidence-grounded AI job-offer analysis product. Users upload an offer letter (PDF/DOCX/image) and receive a structured, plain-English breakdown of compensation, employment terms, benefits, document quality, information gaps, risk indicators, positive signals, affordability, and negotiation opportunities.

Offerwise helps users understand an offer; it does **not** decide whether they should accept or reject it.

## 2. Problem Statement
Offer letters are dense, legally worded, and inconsistent. Candidates can miss variable-pay conditions, bonds, restrictive clauses, notice requirements, clawbacks, termination terms, or important information that is simply absent from the document.

Offerwise addresses this by separating document evidence, extracted facts, missing information, deterministic rules, explanations, and user actions.

## 3. Core Product Principle
**Never invent missing offer-letter information.**

Every extracted field is:
- `found` — explicitly supported by the document
- `not_specified` — not found in the document
- `uncertain` — relevant evidence exists but extraction is not sufficiently reliable

Missing information must be shown as **Not specified**, never as “No”, “standard”, or an inferred value.

A missing field is an **information gap**, not automatically a risk.

## 4. Target Users
- Freshers and early-career candidates
- Experienced professionals comparing offers
- Candidates negotiating compensation or employment terms
- India-first, with extensible global/US support

## 5. MVP Scope

### P0 — Must Have
1. Authentication
2. Secure PDF/DOCX/image upload
3. Document validation and quality checks
4. Structured extraction with evidence
5. Missing/uncertain field handling
6. Deterministic rules engine
7. Evidence-backed report
8. Compensation breakdown
9. Risk flags
10. Information-gap flags
11. Document/evidence flags
12. Positive signals
13. Offer strength score
14. Basic scam-risk indicators
15. Negotiation talking points
16. Term explainer
17. Responsive UI
18. Firebase security

### P1 — MVP Paid/Extended
19. Offer comparison
20. PDF export
21. Manual payment verification
22. Negotiation chatbot
23. Affordability/cost-of-living analysis
24. Admin panel

### P2 — Later
25. Anonymous benchmarking UI
26. Advanced OCR
27. Additional jurisdictions/rulesets
28. Advanced analytics
29. Collaboration features

## 6. Flag Taxonomy

### Risk Flags
Potentially concerning facts supported by evidence:
- high variable compensation
- low fixed compensation relative to stated CTC
- conditional bonus
- joining-bonus clawback
- retention commitment
- employment bond
- bond penalty
- bond without stated buyout
- long notice period
- probation extension
- restrictive termination clause
- non-compete/non-solicit
- broad IP assignment
- moonlighting restriction
- arbitration where applicable
- shift/on-call requirement
- relocation/transfer obligation
- unusual work-hour requirement
- candidate payment/deposit request
- suspicious contact/domain signals

### Information-Gap Flags
Important information absent from the offer:
- notice period
- probation
- insurance
- work location
- variable-pay conditions
- benefits
- termination notice
- joining date
- compensation breakdown

**Information gap ≠ negative fact.**

### Document/Evidence Flags
- missing pages
- missing referenced annexure
- OCR/readability problem
- missing signature where relevant
- missing candidate/company identity
- contradictory salary values
- contradictory dates
- inconsistent company names
- ambiguous clause
- low extraction confidence

### Opportunity Flags
Potential negotiation/clarification opportunities based on actual facts or gaps.

### Positive Signals
Examples:
- clear compensation structure
- explicit fixed pay
- explicit benefits
- clear joining date
- clear work location
- clear variable-pay conditions
- no bond identified in the supplied document

Positive signals are not guarantees of safety.

## 7. Compensation Analysis
Separate:
- CTC
- fixed salary
- variable salary
- bonus
- joining bonus
- retention bonus
- ESOP/equity
- benefits
- guaranteed vs conditional compensation

Never represent variable or conditional compensation as guaranteed take-home pay.

## 8. Offer Strength Score
Score: 0–100.

Categories may include:
- compensation
- benefits
- employment terms
- flexibility
- risk
- information completeness

The score must be transparent and reproducible from versioned rules.

No direct accept/reject recommendation.

## 9. Scam Risk
Transparent 0–100 indicator based on evidence-backed signals:
- payment/deposit request
- suspicious email/domain
- unverifiable company details
- unusually high compensation
- urgency/pressure language
- suspicious contact information
- missing formal employment information

One weak signal must not automatically label an offer a scam.

## 10. Affordability
Where enabled, use external city-level cost data.

Clearly distinguish:
- offer-letter facts
- user-entered overrides
- external estimates

Show basic and comfortable scenarios as ranges.

## 11. Negotiation
Every offer-specific negotiation suggestion must trace to:
- an extracted fact
- a deterministic rule/flag
- or an information gap

## 12. Term Explainer
Users can ask what a term/clause means. The response should use offer context where available, explicitly distinguish general explanation from document-specific interpretation, and avoid legal advice.

## 13. Comparison
Compare 2+ offers using the same normalized schema and rules:
- CTC
- fixed
- variable
- benefits
- constraints
- risks
- information gaps
- affordability
- trade-offs

Avoid a single opaque winner score.

## 14. Authentication & Account
- email/password authentication
- protected dashboard
- saved analyses
- logout
- account settings
- paid-feature access state

## 15. Monetization
Free:
- upload/analysis according to configured credit limits
- core report
- negotiation talking points
- term explainer

Paid/credit-gated:
- comparison
- PDF export
- negotiation chatbot
- other expensive features as configured

Manual UPI/UTR verification is acceptable for the MVP.

## 16. Tech Stack
Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS
- accessible component system

Backend:
- Next.js API routes/server services
- Firebase Authentication
- Firestore
- Firebase Storage

AI:
- provider abstraction
- Gemini for development/free phase
- Claude for production/paid phase

External:
- WhereNext cost-of-living API when configured

## 17. Non-Functional Requirements
- secure by default
- responsive
- accessible WCAG AA target
- strict TypeScript
- explainable analysis
- no raw API secrets in browser
- predictable loading/error states
- auditable rules
- privacy-conscious logging
- maintainable service boundaries

## 18. Data Model
The System Design v2.1 is the authoritative technical schema. The PRD only defines product-level entities and behaviour.

Core entities:
- User
- Offer
- ExtractedField
- Evidence
- Analysis
- Flag
- Comparison
- Payment
- ChatSession
- BenchmarkContribution

## 19. Success Metrics
Track:
- successful uploads
- valid-offer classification rate
- extraction completion rate
- extraction failure rate
- evidence coverage
- percentage of fields correctly represented as missing/uncertain
- report completion
- comparison usage
- export usage
- negotiation feature usage
- user-reported usefulness
- false-positive/false-negative review rate for rules

Do not optimize solely for “number of risks found”; trust and correctness are primary.

## 20. Risks & Assumptions
- Offer formats vary widely.
- OCR may fail on poor scans.
- Legal rules vary by jurisdiction and change over time.
- Cost-of-living data is approximate.
- Scam detection can only identify indicators, not prove fraud.
- LLM output quality varies by provider.
- Rules must be versioned and reviewed before production changes.

## 21. Competitive Positioning
Offerwise differentiates through:
- evidence traceability
- deterministic rules
- explicit missing-information handling
- balanced positive + risk reporting
- offer-specific negotiation support
- transparent comparison
- provider-independent AI architecture

## 22. Phased Roadmap

### Phase 1
Core upload → extraction → evidence → rules → report.

### Phase 2
Comparison, export, affordability, payments/admin.

### Phase 3
Chatbot, benchmarking, richer jurisdiction rules, analytics.

### Phase 4
Production hardening, monitoring, legal/rules review, scale.

## 23. Legal/Safety Disclaimer
“Offerwise provides informational analysis only and does not provide legal, financial, tax, or employment advice. Consult an appropriately qualified professional before making binding decisions.”

## 24. Definition of Done
A release is not complete if it:
- invents missing values
- treats missing data as a negative fact
- generates important flags without evidence
- exposes private documents
- exposes API keys
- allows cross-user access
- presents external estimates as offer-letter facts
- gives direct accept/reject instructions
