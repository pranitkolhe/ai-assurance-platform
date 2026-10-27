# Services

Standalone engine services. Each one runs on its own port, has its
own dependencies, and is tested on its own. The backend never
imports service code -- it talks to services over HTTP.

Start with `CONTRACT.md` in this folder. It is the agreement
between the backend, the frontend, and every service author.

| Service | Port | Status |
|---|---|---|
| `data-integrity/` | 8101 | Implemented, live-tested (2026-10-25) |
| `model-integrity/` | 8102 | Scaffold: metadata only, status `unavailable` |
| `backdoor-assessment/` | 8103 | Scaffold: metadata only, status `unavailable` |
| `inference-provenance/` | 8104 | Implemented: binding-hash verification (signatures TODO) |
| `distribution-shift/` | 8105 | Implemented: class-distribution comparison (embeddings TODO) |

## Run all services (from the repo root)

```bash
./scripts/start-services.sh
```

Or run one service (see its own README):

```bash
cd services/<service>
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port <port>
```

## Test a service

```bash
curl http://127.0.0.1:<port>/health
python -m unittest test_analyzer -v
```

## Rules

- Only edit your own service folder.
- Never return a fake pass. If you cannot analyse the input,
  return `status: "unavailable"` with a limitation.
- Every result must state its limitations and unsupported attacks.
- Services stay offline/air-gapped: no cloud or external APIs.
