# Offerwise — MVP 2-Day Build Specification (v2)

## Goal
Produce a demonstrable, end-to-end Offerwise MVP while keeping the architecture ready for production.

## Day 1 — Core Flow

### 1. Project Setup
- Next.js + TypeScript
- Tailwind
- Firebase Auth
- Firestore
- Firebase Storage
- environment configuration

### 2. Authentication
- signup
- login
- logout
- protected dashboard

### 3. Upload
- PDF/DOCX/image
- file validation
- upload progress
- processing state
- failed state

### 4. Extraction Contract
Implement the normalized field contract:

```ts
status: "found" | "not_specified" | "uncertain"
value: unknown | null
confidence: number
evidence: {
  sourceText: string | null
  sourcePage: number | null
  sourceLocation: string | null
}
```

### 5. Demo Extraction
If AI credentials are unavailable, use a mock provider that returns realistic structured data while preserving the exact production schema.

## Day 2 — Analysis Flow

### 6. Rules Engine
Implement a first set of deterministic rules:
- high variable pay
- conditional bonus
- clawback
- long notice period
- bond
- bond without buyout stated
- long/restrictive clause
- shift requirement
- relocation requirement
- scam payment request
- suspicious email/domain
- urgency language
- missing notice period
- missing probation
- missing insurance
- missing variable conditions
- document contradiction

### 7. Report
Build:
- offer snapshot
- compensation
- employment terms
- risk flags
- information gaps
- document flags
- positive signals
- score
- negotiation points
- disclaimer

### 8. Evidence Drawer
Clicking a finding opens source text + page.

### 9. Score
Implement a transparent rule-based score with category breakdown.

### 10. Demo Scenarios
Create at least three demo documents/results:
1. Clean offer
2. Offer with multiple contractual risks
3. Offer with missing/contradictory information

The third scenario is mandatory to prove that missing data is not fabricated.

## Acceptance Criteria

### Extraction
- Missing fields are null.
- Missing fields display “Not specified”.
- Uncertain fields display an uncertainty state.
- Every material fact has evidence.

### Rules
- Rules run independently from LLM prose.
- Rules are versioned.
- No rule fires on missing data unless explicitly designed as an information-gap rule.

### UI
- Risk and information-gap states are visually distinct.
- Evidence is accessible.
- Mobile layout works.
- Loading/error/empty states exist.

### Security
- API keys never reach browser.
- Users cannot access another user's offer.
- Storage files are private.

### Final Demo
A user can:
Sign up → upload → process → inspect extracted facts → inspect missing fields → inspect flags → open evidence → view score → see negotiation points.

## Deferred after 2-day MVP
- Full payment automation
- Advanced benchmark UI
- Large-scale analytics
- sophisticated OCR pipeline
- production legal-rule coverage across jurisdictions
- advanced PDF rendering
- multi-user collaboration

## Non-Negotiable Invariants
1. Never fabricate an absent offer-letter field.
2. Missing information is not automatically a risk.
3. No important flag without evidence.
4. The LLM explains; deterministic rules classify.
5. No direct accept/reject instruction.
6. Legal claims require jurisdiction-specific confidence and careful wording.


## Security Acceptance Checks
Before demo:
- Firestore owner rules tested with two users
- Storage owner rules tested with two users
- admin-only payment actions tested
- browser bundle contains no AI/API secrets
- uploaded file URLs are not public
- uploaded document text is not written to client logs

## Analysis Integrity Checks
Create automated tests proving:
- absent notice period remains `not_specified`
- absent insurance remains `not_specified`
- uncertain salary does not trigger a salary threshold rule
- a risk flag contains source evidence
- external cost data is marked external
- a document instruction such as “ignore the rules” is treated as document text, not an instruction

## Versioning
Every analysis must persist:
- extraction_version
- rules_version
- analysis_version

## Final Release Gate
Do not call the MVP complete until:
1. two-user authorization test passes
2. missing-data scenario passes
3. contradiction scenario passes
4. evidence drill-down works
5. rules execute independently of LLM prose
6. no direct accept/reject output is produced
7. responsive UI works
8. README setup instructions are verified from a clean environment
