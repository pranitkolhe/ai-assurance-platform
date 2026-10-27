# Trustworthy Computer Vision AI Assurance Platform

**SIH 2026, Problem Statement SIH26228** -- "Trustworthy Computer
Vision Integrity Assurance for Data, Models and Inference Outputs
in Multi-Contributor Pipelines" (Software Edition, Blockchain &
Cybersecurity, Ministry of Defence / Indian Army, DGIS).

A contributor submits an assessment with dataset / model files, an
analyst works a queue, and the system produces findings, a risk
decision, and an assurance report -- evidence-based, offline /
air-gapped, model-agnostic, with no retraining required for a
baseline assessment.

## Architecture (read this before you touch anything)

```
frontend/   React + TypeScript + Vite (port 5173, proxy /api -> :8000)
  src/services/engineService.ts  -- the ONLY frontend route to engines
backend/    FastAPI core (port 8000): auth, assessments, assets,
            uploads + SHA-256, audit, findings, reports, dashboard
  app/api/v1/engines.py          -- unified engine routes (see below)
  app/engines/<domain>/service.py -- HTTP client for one service
services/   Standalone engine services (ports 8101-8105)
  data-integrity/      8101  IMPLEMENTED, live-tested
  model-integrity/     8102  Scaffold (metadata only)
  backdoor-assessment/ 8103  Scaffold (metadata only)
  inference-provenance/ 8104  Implemented: binding-hash check
  distribution-shift/  8105  Implemented: class-distribution check
```

**The rule that makes collaboration work:** friends working on a
service only edit that service's folder. The backend and frontend
are already wired to every service. A service author implements
`analyzer.py` in their folder, runs it on its port, and tests it
live through the backend -- no backend or frontend changes needed.

The full agreement is in [`services/CONTRACT.md`](services/CONTRACT.md).
Read it first. It defines the request/response shape, the status
values, and the no-fake-results rule.

## Quick start

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # then set SECRET_KEY and DATABASE_URL
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend docs: http://127.0.0.1:8000/docs

Default database in `backend/app/config.py` is Postgres
`postgresql+asyncpg://pranitkolhe@localhost:5432/assurance_dev`.
Change it in `.env` (see `.env.example`) -- do not commit real
credentials. Seed users are in `backend/README.md`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

### 3. Engine services

```bash
./scripts/start-services.sh   # starts all five on 8101-8105
# or one service, see its README, e.g. services/data-integrity/README.md
```

Check all services from the backend:

```bash
curl http://127.0.0.1:8000/api/v1/engines/status
```

## Backend engine routes (already written, do not re-invent)

| Route | What it does |
|---|---|
| `GET /api/v1/engines/status` | Health of all five services |
| `POST /api/v1/engines/{domain}/analyze` | Run one domain's service; body `{"path": "...", ...}` |
| `GET /api/v1/datasets/{asset_id}/integrity` | Data-integrity for a dataset asset |
| `GET /api/v1/models/{asset_id}/integrity` | Model-integrity for a model asset |
| `GET /api/v1/backdoor/{asset_id}/assessment` | Backdoor assessment for a model asset |
| `POST /api/v1/provenance/verify` | Verify a caller-supplied manifest |
| `GET /api/v1/distribution-shift/{assessment_id}/summary` | Shift for an assessment's dataset |
| `GET /api/v1/assurance-lab/{assessment_id}/results` | Aggregate live engine results for an assessment |

Domains: `data_integrity`, `model_integrity`, `backdoor_assessment`,
`inference_provenance`, `distribution_shift`.

If a service is down or not yet implemented, these routes return
**HTTP 503**, never a fake pass. A service that cannot analyse an
input returns `status: "unavailable"` with a limitation.

## Frontend engine route

`frontend/src/services/engineService.ts` is the frontend's route
to engines, via the backend only. It has no localStorage fallback
and no fake data. Analyst pages that still show local mock data
are being migrated to it page by page; new pages must use it.

## What is real, what is scaffold, what is not done

Real today:
- Auth (JWT, 120 min), assessments/assets CRUD, file upload with
  SHA-256, analyst dashboard DB aggregates.
- Data-integrity service (COCO + YOLO, SHA-256 duplicates,
  same-content-different-labels = critical, missing/corrupt,
  invalid boxes/labels, class distribution, reference checks,
  per-source risk, computed score/status/confidence).
  Live-tested: poisoned dataset -> `quarantine`, score 0.375,
  confidence 0.75, duplicate 1, missing 1, invalid 2.
- Provenance binding-hash verification and distribution-shift
  class-distribution comparison (see their READMEs for limits).
- Assurance-lab aggregation from live engine results only.

Scaffold (honest `unavailable`, not a verdict):
- Model-integrity and backdoor-assessment: file metadata only
  until torch / onnxruntime loading is implemented.

Not done yet (do not rely on these):
- Reference-registry versioning / hashed profiles / backend
  assignment API (assignments are still frontend localStorage).
- Real PDF/JSON report export and the full governance / risk-
  fusion flow (Phase 5).
- `evidence` and `flagged-images` backend routers: they exist but
  are not included in the router because they import modules
  that do not exist (`app.core.auth`, `app.schemas.evidence`,
  `app.schemas.flagged_image`, missing repositories). Fixing them
  is a separate backend task -- do not fix it by editing a service.
- Dashboard `assurance_summary` is honestly 0 until Phase 5
  backs it with engine results (the old fixed 98/95/100/92
  values were removed).
- The old hard-coded endpoints were removed: model inspection
  (ResNet-50 / 0.942 / "low"), provenance manifest (fake Ed25519
  signature, verified=True), and distribution-shift summary
  (0.042 / 0.38 / pass). If you see those values anywhere else,
  that is a bug -- report it.

## Security notes for contributors

- No anonymous fallback: without a Bearer token, protected
  routes return 401. The old code silently returned
  `admin@assure.local` when no token was sent; that is removed.
- `SECRET_KEY` must come from the environment. The default in
  config is a development placeholder only.
- Never commit `.env`, `venv/`, `__pycache__/`, uploads, or
  database files. See `.gitignore`.
- Services are offline/air-gapped: no cloud or external APIs.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the workflow, the
service-assignment table, and the pull-request checklist.
