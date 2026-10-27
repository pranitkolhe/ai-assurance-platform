# Inference Provenance Service (port 8104)

Standalone FastAPI service. Backend routes: `POST /api/v1/engines/inference_provenance/analyze`
and `POST /api/v1/provenance/verify`. Contract: `services/CONTRACT.md`.

## What is implemented today (real)

- Binding recomputation: `binding_hash` must equal
  `SHA-256(input_hash + model_digest + config_hash + output_hash)`.
  A mismatch is a critical tamper finding, status `quarantine`.
- Required-field checks, optional asset-file SHA-256 comparison,
  and replay detection against a caller-supplied `seen_sequences`
  list in `reference`.
- Scoring: pass (1.0) / review (0.5, missing fields or no replay
  controls) / quarantine (0.0, tamper or replay).

## What is NOT implemented yet

- Ed25519 signature verification. The old backend hard-coded a
  fake signature; this service does not. Add `cryptography`, a
  real signing-key registry, and signature checks, then update the
  `verified` meaning in this README and in the result limitations.
- A persistent sequence/nonce store. This service is stateless;
  the backend must own seen sequences, or replay checks stay
  limited to what the caller supplies.
- Timestamp freshness / clock-skew policy.

## Run and test live

```bash
cd services/inference-provenance
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8104
curl http://127.0.0.1:8104/health
python -m unittest test_analyzer -v
```

Example valid manifest (binding = SHA-256 of the four hashes
concatenated, in this order):

```json
{"manifest": {"input_hash": "in-1", "model_digest": "model-1", "config_hash": "cfg-1", "output_hash": "out-1", "binding_hash": "<sha256(in-1model-1cfg-1out-1)>", "sequence": 1, "timestamp": "2026-10-25T00:00:00Z", "nonce": "abc123"}}
```

Change any one hash without updating `binding_hash` and the result
must become `quarantine` with `tamper_detected: true`.

## Do not change

- `backend/` or `frontend/` -- they are already wired to this
  service. Only change files inside this folder.
- The core response fields in `services/CONTRACT.md`.
