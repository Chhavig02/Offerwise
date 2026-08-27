<div align="center">

# Offerwise

**An evidence-grounded career decision assistant.**

Upload a job offer. Get a report where every number, risk, and recommendation traces back to a real source — your document, a live company search, or a live market-salary lookup. Nothing is guessed to fill a gap.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](frontend)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](frontend)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](backend)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](backend)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-336791?logo=postgresql&logoColor=white)](backend/prisma)
[![Firebase Auth](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=white)](frontend/src/contexts/AuthContext.tsx)
[![Gemini](https://img.shields.io/badge/AI-Gemini%20%2B%20Groq-6D28D9)](backend/src/providers/ai)

</div>

<br>

## Contents

- [Core Features](#core-features)
- [How It Works](#how-it-works)
- [AI Providers](#ai-providers)
- [External Services](#external-services)
- [Decision Engine](#decision-engine)
- [Real Data / No Mock Production Data](#real-data--no-mock-production-data)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Security](#security)
- [Current Status](#current-status)
- [Roadmap](#roadmap)

<br>

## Core Features

| | |
|---|---|
| 📄 **Offer letter upload / text analysis** | Upload a PDF/DOCX offer letter, or paste the raw text |
| 🔎 **AI extraction** | Structured fields — compensation, bond, notice period, non-compete, and more — pulled from the document |
| ✅ **Evidence-grounded extraction** | Every extracted field is checked against the source text; anything unverifiable is downgraded, never presented as fact |
| ⚠️ **Contract/risk analysis** | A deterministic rules engine flags risky or unusual clauses |
| 📊 **Offer score** | A 0–100 score computed purely from the rules engine's flags |
| 💰 **Market compensation insights** | Live salary benchmarking against role and location |
| 🏢 **Company intelligence** | Live web research on the employer — hiring activity, funding, layoffs, legal signals |
| ❓ **Information gaps** | Clauses the offer letter doesn't mention are surfaced as gaps, never treated as risks |
| 🧭 **Deterministic Decision Engine** | Combines the above into one recommendation with an explainable basis |
| 🎯 **Accept / Negotiate / Reject / Needs More Information** | The final recommendation, in plain terms |
| 🧩 **Decision breakdown** | A per-dimension assessment — compensation, contract terms, market position, company profile, completeness |
| 🤝 **Negotiation priorities** | The specific terms worth pushing back on, in priority order |
| 📝 **Before-you-accept checklist** | Open questions to clarify with the employer before accepting |
| 🔗 **Evidence/source traceability** | Every citation behind the report, with links to original sources where available |
| 📁 **Offer history/dashboard** | A dashboard and full offer list for the signed-in user |
| ⚙️ **User preferences/settings** | Display name, default currency, and jurisdiction — persisted server-side |
| 📱 **Responsive report UI** | The report and surrounding pages work on both desktop and mobile |

<br>

## How It Works

```
Offer letter (PDF/DOCX or pasted text)
        │
        ▼
 Document text extraction   →  pdf-parse / mammoth
        │
        ▼
 AI extraction              →  Gemini (primary), Groq (fallback)
        │
        ▼
 Data sanitization
        │
        ▼
 Evidence verification      →  rejects any field whose cited text isn't actually in the document
        │
        ▼
 Company research           →  Tavily — only runs if a company name was confidently extracted
        │
        ▼
 Deterministic rules engine →  risk / information-gap / opportunity flags
        │
        ▼
 Offer comparison           →  market salary data via Adzuna + company-signal comparison
        │
        ▼
 Score calculation
        │
        ▼
 Deterministic Decision Engine
        │
        ▼
 Database persistence       →  PostgreSQL via Prisma
        │
        ▼
 Frontend report
```

> **The Decision Engine does not call Gemini, Groq, or any other AI model.** It's a plain deterministic function that reads the already-verified extraction, the rules-engine flags, the market comparison, and the company research, then applies fixed threshold logic to produce a recommendation and its explanation. The recommendation, the decision breakdown, and the negotiation priorities are all derived directly from data validated earlier in the pipeline — none of it is generated text from a model.

<br>

## AI Providers

- **Gemini** is the primary extraction provider.
- **Groq** is used as an automatic fallback if Gemini fails (rate limit, quota, or availability error), and can also be selected as the primary provider directly.
- Provider selection and API keys are configured entirely through environment variables — no keys are hardcoded, and none are ever sent to the frontend.
- Both providers are subject to their own rate limits and quotas (e.g. Gemini's free tier and Groq's tokens-per-minute limit). Hitting these limits during live analysis surfaces as an extraction failure or an automatic fallback to Groq — a limitation of the underlying provider plans, not a bug in the pipeline.
- A mock provider exists for local development/testing only and is never used unless explicitly selected via configuration.

<br>

## External Services

| Service | Purpose |
|---|---|
| **Gemini** (`@google/genai`) | Primary structured data extraction from the offer letter |
| **Groq** | Fallback structured data extraction |
| **Tavily** | Live web search used for company research (hiring, funding, layoffs, legal, restructuring signals) |
| **Adzuna** | Live job-market salary histogram data, used to benchmark the offer's compensation |
| **PostgreSQL + Prisma** | Persistence for users, offers, and analysis results |
| **Firebase Authentication** | User sign-up/sign-in on the frontend, and ID-token verification on the backend |

<br>

## Decision Engine

The Decision Engine evaluates:

- **Compensation** — is fixed pay present, and how does it compare to the market benchmark?
- **Contractual risk** — how many, and how severe, are the rules-engine's risk flags?
- **Market alignment** — is the offer above, at, or below the market median?
- **Company intelligence** — are there positive (hiring, funding) or concerning (layoffs, legal, restructuring) signals?
- **Information gaps** — is enough of the offer specified to make a confident call?
- **Evidence quality** — were any core fields extracted with uncertain/unverifiable evidence?

It produces one of four recommendations:

| Recommendation | Meaning |
|---|---|
| 🟢 **ACCEPT** | No material risks, competitive compensation, no missing critical information |
| 🟡 **NEGOTIATE** | Solid offer, but specific terms or compensation are worth pushing back on |
| 🔴 **REJECT** | Severe combined risk — e.g. critical contractual risk plus compensation well below market |
| 🔵 **NEEDS MORE INFORMATION** | Critical details (like fixed salary) are missing and must be clarified first |

When external data (market benchmark or company research) is unavailable, the engine lowers its **confidence** rather than inventing a negative signal — a missing market benchmark or missing company research is never treated as a red flag against the offer.

<br>

## Real Data / No Mock Production Data

> Production-facing report data is sourced from the authenticated user's uploaded offer and real backend services. Demo/fake business data is not used to populate production reports.

Automated tests do use synthetic fixtures (e.g. mocked provider responses) to exercise the pipeline deterministically without live API calls. Those fixtures live only inside the test suite and are never reachable from a real user's report.

<br>

## Project Structure

```
Offerwise/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma            # User / Offer / OfferAnalysis models
│   └── src/
│       ├── routes/                  # Express routes (offers, user preferences)
│       ├── providers/ai/            # Gemini / Groq / mock extraction providers
│       ├── rules/                   # Deterministic risk & gap rules engine
│       ├── services/
│       │   ├── decisionEngine/      # Deterministic recommendation engine
│       │   ├── companyResearch/     # Tavily-backed company intelligence
│       │   ├── offerComparison/     # Market data (Adzuna) + comparison logic
│       │   ├── pipeline.ts          # Orchestrates the full analysis flow
│       │   ├── evidenceService.ts   # Anti-hallucination evidence validation
│       │   ├── scoreService.ts      # Offer score calculation
│       │   └── storageService.ts    # Local-disk file storage for uploads
│       ├── lib/                     # Prisma client, Firebase Admin init
│       ├── types/                   # Shared backend types
│       └── tests/                   # Vitest test suite
└── frontend/
    └── src/
        ├── app/                     # Next.js App Router pages (dashboard, report, upload, etc.)
        ├── components/
        │   ├── report/              # Report page sections (pay, market, contract, decision, etc.)
        │   ├── layout/               # Sidebar, Navbar
        │   └── ui/                  # Shared UI primitives
        ├── contexts/                # Firebase auth context
        ├── lib/firebase/            # Firebase client config
        └── types/                   # Shared frontend types
```

<br>

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chhavig02/Offerwise.git
   cd Offerwise
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Configure environment variables**
   - Copy `backend/.env.example` → `backend/.env` and fill in real values.
   - Copy `frontend/.env.example` → `frontend/.env.local` and fill in real values.

5. **Configure the database**
   - Provide a running PostgreSQL instance and set `DATABASE_URL` in `backend/.env`.

6. **Run Prisma setup** (from `backend/`)
   ```bash
   npx prisma generate
   npx prisma db push
   ```

7. **Start the backend** (from `backend/`, or `npm run dev:backend` from the repo root)
   ```bash
   npm run dev
   ```

8. **Start the frontend** (from `frontend/`, or `npm run dev:frontend` from the repo root)
   ```bash
   npm run dev
   ```

Backend → `http://localhost:3001` · Frontend → `http://localhost:3000` — both local development URLs only.

<br>

## Environment Variables

<table>
<tr>
<td valign="top">

**`backend/.env`**
```env
PORT=
DATABASE_URL=
FRONTEND_URL=
GEMINI_API_KEY=
GROQ_API_KEY=
TAVILY_API_KEY=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
FIREBASE_PROJECT_ID=
```

</td>
<td valign="top">

**`frontend/.env.local`**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_API_URL=
```

</td>
</tr>
</table>

See `backend/.env.example` and `frontend/.env.example` for the full reference. Real values are never committed.

<br>

## Testing

**Backend** — from `backend/`
```bash
npm test            # vitest run
npm run lint         # eslint .
npx tsc --noEmit
npm run build        # tsc
```

**Frontend** — from `frontend/`
```bash
npm run lint         # eslint
npx tsc --noEmit
npm run build         # next build
```

The frontend does not currently have an automated test suite — `lint`, `tsc`, and `build` are its verification commands.

A small number of backend tests call the live Gemini and Groq APIs directly and can fail with a `429` (rate limit/quota) response under free-tier usage — a provider plan limitation, not a defect in the code.

<br>

## Security

- API keys (Gemini, Groq, Tavily, Adzuna, Firebase Admin, database credentials) are used server-side only and are never sent to or readable by the frontend.
- `.env` files are excluded from version control and must never be committed.
- All `/api/offers` and `/api/user` routes require a valid Firebase ID token; offer routes additionally verify that the requested offer belongs to the authenticated user before returning or modifying it.
- Errors from external providers are sanitized before being logged or surfaced — authorization headers and API keys are stripped rather than passed through.

<br>

## Current Status

> Core offer analysis, evidence validation, market/company intelligence, deterministic decision assessment, negotiation priorities, and report UI are implemented and tested.

This is an actively developed project, not a finished, hardened production system — see [Roadmap](#roadmap) for known gaps.

<br>

## Roadmap

Not implemented yet:

- [ ] Multiple-offer side-by-side comparison and saved-offer negotiation intelligence
- [ ] Additional market data sources beyond Adzuna
- [ ] More advanced (model-generated, rather than template-based) negotiation assistance
- [ ] Cloud-backed file storage (uploads currently persist to local disk)
- [ ] Production observability, alerting, and centralized rate-limit management for the AI providers
- [ ] An automated frontend test suite
