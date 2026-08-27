# Offerwise — Design System (v2.1)

## 1. Design Philosophy
Trustworthy, intelligent, professional, modern, premium, minimal, calm, transparent.

Offerwise handles salary and legal information. It must feel like reliable infrastructure, not a flashy AI demo.

Avoid:
- glassmorphism
- neon
- heavy gradients
- purple AI styling
- excessive animation
- cartoon illustrations for serious states

## 2. Semantic Color
Primary: #2563EB
Secondary: #475569
Accent: #0F766E
Success: #16A34A
Warning: #D97706
Error: #DC2626
Info: #0284C7
Background: #FFFFFF
Surface: #F8FAFC
Border: #E2E8F0
Text Primary: #0F172A
Text Secondary: #475569
Text Muted: #94A3B8

Color must communicate meaning rather than decorate.

## 3. Flag Semantics
Risk:
- high/critical → Error
- medium → Warning
- low → muted warning/info

Information Gap:
- Info blue
- never red merely because data is missing

Document/Evidence:
- Info/Warning depending on impact

Opportunity:
- Teal/accent

Positive:
- Success

Never use red for “Not specified”.

## 4. Typography
Inter for UI.
IBM Plex Mono for precise numeric/tabular values.

Use numeric typography for:
- CTC
- percentages
- dates
- scores
- compensation breakdowns

## 5. Core Components
- Header
- Sidebar
- Upload area
- Offer card
- Summary card
- Risk card
- Information-gap card
- Evidence drawer
- Document preview
- Score card
- Compensation breakdown
- Comparison card
- Negotiation card
- Term explainer
- Chat panel
- Empty state
- Loading skeleton
- Error state
- Payment/admin table

## 6. Risk Card
Structure:
Severity badge
Title
One-line explanation
“Why this matters”
Evidence
Source page
Rule ID / category
Optional action

Evidence must be expandable, not hidden.

## 7. Information Gap Card
Use:
“Not specified in the offer letter”

Then:
“Consider confirming this with the employer.”

Never:
“Not provided = No”

## 8. Evidence UI
Every important finding should expose:
- exact source excerpt
- page
- field
- confidence where relevant

The interface should make the source traceable without overwhelming the user.

## 9. Score UI
Show:
- score
- category breakdown
- top positive contributors
- top concerns
- data coverage / limitations

Do not show a simplistic “Good/Bad” verdict as the sole explanation.

## 10. Upload
Dashed border, surface fill, centered icon, Browse files button.
Drag-over uses subtle primary tint.
No bouncing or scaling.

## 11. Accessibility
WCAG AA target.
Visible keyboard focus.
44×44px minimum mobile touch target.
Icon-only controls need aria-label.
Status changes use appropriate accessible semantics.
Charts need text equivalents.

## 12. Responsive Behaviour
Desktop-first but fully usable on mobile.
Evidence panels become bottom sheets/drawers on mobile.
Comparison tables become horizontally scrollable or stacked.
Do not hide critical warnings only on desktop.

## 13. Dark Mode
Use the same semantic system, not neon “AI dark mode”.

Background #0B0F14
Surface #131924
Border #232B39
Text Primary #F1F5F9
Text Secondary #94A3B8
Primary #3B82F6
Accent #14B8A6
Success #22C55E
Warning #F59E0B
Error #EF4444
Info #38BDF8
