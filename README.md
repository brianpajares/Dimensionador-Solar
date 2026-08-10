# SolConfigura

Solar feasibility, sizing, BOM and conversion platform for Peru and LatAm.

SolConfigura turns a location and an energy profile into an auditable solar pre-feasibility assessment in minutes: solar resource, deterministic system sizing, traceable equipment BOM, financial scenarios, AI-assisted proposal text and a measurable quote or pilot request.

This is intentionally not positioned as a simple solar calculator. The product wedge is a conversion OS for households, SMEs and installers: each project creates structured demand, catalog, pricing and funnel data that can improve installer sales workflows over time.

## What Works Today

- Off-grid and grid-tied solar assessment flows.
- PVGIS 5.3 solar resource lookup with documented geographic fallback.
- Deterministic sizing engine for PV array, batteries, controller and inverter requirements.
- Traceable BOM with supplier, country, source, verification date and validity window.
- Financial model with base metrics plus conservative, base and optimistic scenarios.
- Pre-feasibility confidence score, assumptions and engineering warnings.
- AI proposal generation through Gemini when `GEMINI_API_KEY` is available, with a local fallback proposal.
- Lead and pilot capture endpoint (`/api/leads`) that stores validation signals in JSONL for immediate funnel tracking.

## Product Thesis

Solar adoption in LatAm is limited by fragmented pre-sales work: resource data, consumption, sizing, compatibility, pricing, proposal preparation, installer routing and financing are often handled manually. SolConfigura compresses that workflow into a single auditable experience.

Initial business model hypotheses:

- Free B2C assessment for homeowners and SMEs.
- Paid premium reports or assisted engineering review.
- B2B SaaS / white-label workspace for installers.
- Qualified lead fee or partner referral fee for installers, distributors and financing providers.
- Future API for solar assessment embedded in partner websites.

## Engineering Methodology

The sizing engine is deterministic. AI is used to explain, structure and draft commercial material, not to decide critical electrical sizing.

Key assumptions are versioned in code:

- `ENGINE_VERSION`: calculation rules and core constants.
- `CATALOG_VERSION`: equipment and price benchmark dataset.
- `DATASOURCE_VERSION`: solar data adapters and fallback model.

Every assessment returns:

- project ID and timestamp.
- solar source and confidence.
- BOM item price traceability.
- financial scenarios.
- warnings and assumptions.
- recommended next action.

## Limits

This app produces pre-feasibility, not final engineering.

Before procurement or installation, every project requires:

- site visit and shading review.
- usable roof or ground area validation.
- structural review.
- cable routing and voltage drop calculation.
- string, Voc/Vmp, Isc/Imp and MPPT compatibility checks.
- final design signed by a qualified electrical engineer according to local regulation.

## Local Setup

```bash
npm install
npm run dev
```

Optional:

```bash
GEMINI_API_KEY=your_key
```

Without `GEMINI_API_KEY`, proposal generation uses a deterministic fallback template.

## Scripts

```bash
npm run lint
npm test
npm run build
npm start
```

`npm test` bundles and runs the solar engine regression checks without relying on `tsx` runtime spawning, which is more reliable on locked-down Windows environments.

## API

`POST /api/assess`

Creates a solar pre-feasibility assessment.

`POST /api/proposal`

Generates a commercial/technical proposal from a completed assessment.

`POST /api/leads`

Captures quote, pilot or feedback intent tied to a `projectId`. In the current MVP it writes to `solconfigura_leads.jsonl`; production should replace this with a persistent database.

## Roadmap To Venture-Ready

- Persistent accounts, organizations and saved projects.
- Shareable read-only assessment URLs and PDF export.
- Product analytics dashboard: start, step completion, assessment complete, proposal download, quote request and pilot request.
- Real NASA POWER adapter or remove NASA language everywhere.
- Country configuration layer for tariffs, currencies, catalog and grid rules.
- Installer workspace with pipeline status and win/loss feedback.
- Bill reader for extracting kWh, tariff and utility from PDF/image bills.
- Financing pre-qualification and partner routing.

## Deployment Notes

The current app is suitable for Vercel-style deployment as a Vite frontend plus bundled Express server. For production monetization, replace local JSONL/cache files with managed persistence such as Postgres, Redis/KV or another durable database.

