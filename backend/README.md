# AI Assurance Platform – Backend Architecture

Production-ready backend architecture for the **Trustworthy Computer Vision AI Assurance Platform**, built with **FastAPI**, **SQLAlchemy 2.0 (Async)**, **Alembic**, and **Pydantic v2**.

---

## 🏛️ Directory Structure Overview

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app factory, CORS, exception handlers & lifespan
│   ├── config.py                # Pydantic-settings config (DB, JWT, paths, uploads)
│   ├── dependencies.py          # Session and RBAC dependencies (get_db, require_role)
│   │
│   ├── api/                     # REST API Routing Layer
│   │   ├── __init__.py
│   │   ├── router.py            # Aggregated v1 API router
│   │   └── v1/
│   │       ├── health.py        # System health & liveness probes
│   │       ├── auth.py          # JWT login & profile
│   │       ├── users.py         # User management (Admin)
│   │       ├── assets.py        # Asset registration & upload tracking
│   │       ├── datasets.py      # Dataset inspection endpoints
│   │       ├── models.py        # Model inspection & artifact verification
│   │       ├── inferences.py    # Inference record logging & replay detection
│   │       ├── provenance.py    # Cryptographic manifest & signature verification
│   │       ├── distribution_shift.py # Drift & shift analysis endpoints
│   │       ├── assurance_lab.py # Multi-domain laboratory test results
│   │       ├── findings.py      # Automated & manual findings tracking
│   │       ├── reports.py       # Assurance summary & analyst decision recording
│   │       ├── audit.py         # Tamper-evident audit trail querying
│   │       ├── references.py    # Benchmark reference registry
│   │       └── dashboard.py    # Analyst & Contributor aggregate dashboards
│   │
│   ├── schemas/                 # Pydantic v2 Models (DTOs & Validation)
│   │   ├── common.py            # Generic pagination, BaseSchema, standard responses
│   │   ├── user.py              # User, Token, and Auth schemas
│   │   ├── assessment.py        # Assessment lifecycle & processing state schemas
│   │   ├── asset.py             # Asset submission schemas
│   │   ├── dataset.py           # Dataset integrity results schemas
│   │   ├── model.py             # Model integrity results schemas
│   │   ├── inference.py         # Inference record schemas
│   │   ├── provenance.py        # Cryptographic provenance manifest schemas
│   │   ├── finding.py           # Findings & defect severity schemas
│   │   ├── report.py            # Disposition & report export schemas
│   │   ├── reference.py         # Reference benchmark schemas
│   │   ├── evaluation.py        # Evaluation scenario schemas
│   │   ├── assurance.py         # Multi-domain assurance result schemas
│   │   └── dashboard.py         # High-level metrics & queue schemas
│   │
│   ├── db/                      # Database & ORM Layer (SQLAlchemy 2.0 Async)
│   │   ├── base.py              # DeclarativeBase class
│   │   ├── session.py           # Async engine & sessionmaker generator
│   │   ├── init_db.py           # Schema initialization & seed data
│   │   ├── models/              # Declarative ORM models
│   │   │   ├── user.py
│   │   │   ├── assessment.py
│   │   │   ├── asset.py
│   │   │   ├── dataset.py
│   │   │   ├── model_artifact.py
│   │   │   ├── inference_record.py
│   │   │   ├── analysis_run.py
│   │   │   ├── finding.py
│   │   │   ├── evidence.py
│   │   │   ├── flagged_image.py
│   │   │   ├── reference.py
│   │   │   ├── reference_assignment.py
│   │   │   ├── reference_profile.py
│   │   │   ├── risk_decision.py
│   │   │   ├── assurance_result.py
│   │   │   ├── report.py
│   │   │   ├── audit_event.py
│   │   │   └── signing_key.py
│   │   └── repositories/        # Async Repository Pattern
│   │       ├── user_repository.py
│   │       ├── assessment_repository.py
│   │       ├── asset_repository.py
│   │       ├── dataset_repository.py
│   │       ├── model_repository.py
│   │       ├── finding_repository.py
│   │       ├── inference_repository.py
│   │       ├── audit_repository.py
│   │       └── reference_repository.py
│   │
│   ├── core/                    # Cross-cutting foundational modules
│   │   ├── enums.py             # Domain enums strictly typed
│   │   ├── exceptions.py        # Custom domain exceptions & HTTP handlers
│   │   ├── logging.py           # Structured logging setup
│   │   ├── security.py          # Password hashing & JWT generation
│   │   ├── hashing.py           # SHA-256 chunked file hasher
│   │   ├── canonicalization.py  # RFC-compliant deterministic JSON serializer
│   │   ├── audit_chain.py       # SHA-256 event chaining
│   │   └── access_control.py    # Fine-grained Role-Based Access Control
│   │
│   ├── storage/                 # Storage abstraction & artifact persistence
│   │   ├── base.py              # Abstract StorageBackend
│   │   ├── local_storage.py     # Local async disk storage implementation
│   │   ├── artifact_paths.py    # Directory routing helpers
│   │   └── cleanup.py           # Automated retention & quarantine cleanup
│   │
│   ├── services/                # Business logic orchestrators
│   │   ├── asset_service.py
│   │   ├── submission_service.py
│   │   ├── analysis_orchestrator.py
│   │   ├── risk_fusion_service.py
│   │   ├── finding_service.py
│   │   ├── reference_service.py
│   │   ├── audit_service.py
│   │   └── report_service.py
│   │
│   ├── engines/                 # Pluggable Analysis & Assurance Engines
│   │   ├── dataset_integrity/   # Duplicates, formatting, label noise, batch bias
│   │   ├── model_integrity/     # Weights inspection, architecture, fingerprinting
│   │   ├── backdoor_assessment/ # Trojan triggers, ASR, activation clustering
│   │   ├── provenance/          # Manifests, digital signing, replay defense
│   │   ├── distribution_shift/  # Wasserstein, KS test, MMD covariate shift
│   │   └── evaluation/          # Benchmark suite & scenario testing registry
│   │
│   ├── reporting/               # Assurance reporting and exports
│   │   ├── report_builder.py
│   │   ├── pdf_export.py
│   │   ├── json_export.py
│   │   └── templates/assurance_report.html
│   │
│   └── utils/                   # Shared utility functions
│       ├── file_validation.py   # File extension & size validator (COCO, YOLO, ONNX, etc.)
│       ├── image_utils.py       # Image resizing, EXIF inspection
│       ├── model_utils.py       # Tensor introspection helpers
│       └── time_utils.py        # UTC timestamp helpers
│
├── tests/                       # Automated Pytest suite
│   ├── conftest.py              # Async client & in-memory SQLite fixture
│   ├── unit/                    # Fast isolated tests
│   ├── integration/             # End-to-end API & pipeline tests
│   └── fixtures/                # Clean & poisoned sample fixtures
│
├── scripts/                     # Operational scripts
│   ├── init_db.py               # Table creation & initial user seeding
│   ├── seed_reference_registry.py # Benchmark references seed
│   ├── generate_demo_cases.py   # Synthesize test data
│   └── run_benchmark.py         # CLI benchmark battery runner
│
├── migrations/                  # Alembic database migration scripts
├── data/                        # Persistent local storage (quarantine, models, etc.)
├── requirements.txt             # Pinned python dependencies
├── pyproject.toml               # Build & tool configuration
├── Dockerfile                   # Production container definition
├── alembic.ini                  # Alembic DB migration configuration
└── .env.example                 # Environment variables template
```

---

## 👥 Multi-Developer Team & Branching Guide

This architecture is cleanly decoupled into horizontal layers and vertical engine domains. Team members can develop their modules on separate git branches without merge conflicts:

| Team Role / Member | Focus Area | Branch Prefix | Key Directories |
| :--- | :--- | :--- | :--- |
| **Backend Lead / Core** | Auth, DB Session, Config, Main | `feature/core-*` | `app/core/`, `app/db/`, `app/config.py` |
| **API & Frontend Bridge** | Routers, Schemas, Repositories | `feature/api-*` | `app/api/v1/`, `app/schemas/` |
| **Data Integrity Engineer** | Dataset parsing, duplicates, noise | `feature/engine-dataset` | `app/engines/dataset_integrity/` |
| **Model Integrity Engineer** | ONNX/PyTorch inspection, trojans | `feature/engine-model` | `app/engines/model_integrity/` |
| **Security & Provenance** | Backdoor, signing, audit chain | `feature/engine-security` | `app/engines/provenance/`, `app/engines/backdoor_assessment/` |
| **Distribution / MLOps** | Covariate shift, statistical tests | `feature/engine-shift` | `app/engines/distribution_shift/` |
| **Reporting & Export** | PDF/HTML export, Risk fusion | `feature/reporting` | `app/reporting/`, `app/services/` |

---

## 🚀 Getting Started

### 1. Environment Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables

```bash
cp .env.example .env
```

### 3. Initialize Database & Seed Users

```bash
python scripts/init_db.py
```

Default credentials created:
- **Admin**: `admin@assure.local` / `admin123`
- **Contributor**: `contributor@assure.local` / `contributor123`
- **Analyst**: `analyst@assure.local` / `analyst123`

### 4. Run Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

- API Base: `http://localhost:8000/api/v1`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Alternative ReDoc: `http://localhost:8000/redoc`

---

## 🧪 Testing

```bash
pytest tests/ -v
```

