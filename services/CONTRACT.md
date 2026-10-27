# Engine-service contract (READ THIS FIRST)

Every service in this folder follows the same contract, so the backend
and frontend never have to change when a service is implemented, and
a service author never has to guess what the backend expects.

## Services and ports

| Service | Folder | Port | Backend env var | Domain |
|---|---|---|---|---|
| Data integrity | `data-integrity/` | 8101 | `DATA_INTEGRITY_URL` | `data_integrity` |
| Model integrity | `model-integrity/` | 8102 | `MODEL_INTEGRITY_URL` | `model_integrity` |
| Backdoor assessment | `backdoor-assessment/` | 8103 | `BACKDOOR_URL` | `backdoor_assessment` |
| Inference provenance | `inference-provenance/` | 8104 | `PROVENANCE_URL` | `inference_provenance` |
| Distribution shift | `distribution-shift/` | 8105 | `DISTRIBUTION_SHIFT_URL` | `distribution_shift` |

## Rules for every service

1. **Standalone.** A service runs on its own port, with its own
   `main.py`, `analyzer.py`, `schemas.py`, `requirements.txt`,
   `Dockerfile`, `README.md`, and `test_analyzer.py`. It never writes
   to the backend database and never imports backend code.
2. **Stateless.** It reads files from the path it is given and
   returns a result. It does not keep state between requests.
3. **Endpoints.** Every service must expose:
   - `GET /health` -> `{"service": "<name>", "status": "ok", "version": "<semver>"}`
   - `GET /` -> service name, version, and docs link (`/docs`)
   - `POST /analyze` -> the result object below
4. **Errors.** Missing path -> HTTP 404. Bad / unsupported input ->
   HTTP 422. Never return a pass for an input you could not analyse.
5. **No fake results.** If you cannot analyse the input yet, return
   `status: "unavailable"`, `score: 0.0`, `confidence: 0.0`, and a
   `limitations` entry saying what is not implemented. The backend
   turns that into HTTP 503. A fake pass is a bug, not a placeholder.
6. **Only change your own folder.** Do not edit `backend/`,
   `frontend/`, or another service's folder. If the backend contract
   is wrong for your domain, open an issue / tell the owner -- do
   not work around it by changing the backend.

## POST /analyze -- request

Each service's `schemas.py` defines its own request, but all accept
the same generic shape. Send the fields your domain needs:

```json
{
  "path": "/absolute/path/to/asset",
  "dataset_path": "/absolute/path/to/dataset",
  "model_path": "/absolute/path/to/model.onnx",
  "clean_dataset_path": "/absolute/path/to/clean/dataset",
  "manifest": { "input_hash": "...", "model_digest": "...", "config_hash": "...", "output_hash": "...", "binding_hash": "...", "sequence": 1, "timestamp": "2026-10-25T00:00:00Z", "nonce": "..." },
  "format": "COCO",
  "reference": { "class_schema": ["car", "truck"], "class_distribution": {"car": 0.5, "truck": 0.5} },
  "access_level": "white-box"
}
```

`access_level` is `"white-box"` (weights / activations available) or
`"black-box"` (only inputs and outputs). White-box methods must fall
back to a behavioural check, or to `unavailable` with a stated
limitation, under black-box-only access -- never silently pretend
to have white-box evidence.

## POST /analyze -- response (core fields, required)

```json
{
  "domain": "model_integrity",
  "status": "pass | review | quarantine | unavailable",
  "score": 0.0,
  "confidence": 0.0,
  "findings": [
    {
      "id": "duplicate-content",
      "title": "Duplicate image content",
      "severity": "critical | high | medium | low | info",
      "reason": "Human-readable reason, in plain words.",
      "evidence": {"duplicate_extra_copies": 1},
      "affected_assets": ["images/a.png"]
    }
  ],
  "limitations": ["What this result does NOT cover."],
  "unsupported": ["Attack classes explicitly not covered."]
}
```

Domain-specific fields (for example `tamper_detected`, `verified`,
`max_deviation`) may be added alongside the core fields, but must
never replace them.

## Status meanings

- `pass` -- analysed, no blocking finding.
- `review` -- analysed, a high finding, or a score that needs a human.
- `quarantine` -- analysed, a critical finding, or a score below the
domain threshold stated in that service's README.
- `unavailable` -- not analysed (service down, not implemented,
  missing dependency, or input unusable). Displayed as such.

## How to test your service live (no backend needed)

```bash
cd services/<your-service>
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port <port>

curl http://127.0.0.1:<port>/health
curl -X POST http://127.0.0.1:<port>/analyze \
  -H "Content-Type: application/json" \
  -d '{"path": "/absolute/path/to/test/asset"}'
```

Then test through the backend (backend on port 8000):

```bash
curl http://127.0.0.1:8000/api/v1/engines/status
curl -X POST http://127.0.0.1:8000/api/v1/engines/<domain>/analyze \
  -H "Content-Type: application/json" \
  -d '{"path": "/absolute/path/to/test/asset"}'
```

## Reference implementation

`data-integrity/` is the only fully implemented service today
(port 8101, live-tested on 2026-10-25). Copy its shape --
`main.py` / `analyzer.py` / `test_analyzer.py` / `README.md` --
when you start a new service, and keep your `analyzer.py` pure
Python where possible so the service stays offline/air-gapped.
" 