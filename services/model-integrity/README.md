# Model Integrity Service (port 8102)

Standalone FastAPI service. Backend route: `POST /api/v1/engines/model_integrity/analyze`
and `GET /api/v1/models/{asset_id}/integrity`. Contract: `services/CONTRACT.md`.

## Status today: scaffold, not a verdict

`analyzer.py` currently only reports real file metadata (size,
SHA-256, extension-based format hint) and returns `status:
"unavailable"` with a limitation. That is intentional: the backend
turns it into HTTP 503, so no one can mistake it for a clean model.

## Run and test live

```bash
cd services/model-integrity
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8102
curl http://127.0.0.1:8102/health
curl -X POST http://127.0.0.1:8102/analyze -H "Content-Type: application/json" -d '{"model_path": "/absolute/path/to/model.onnx"}'
python -m unittest test_analyzer -v
```

## TODO for the assignee (in order)

1. Add `torch` and `onnxruntime` to `requirements.txt` (this service only).
2. In `analyzer.py`, load ONNX via onnxruntime and TorchScript via
   torch, and fill in `backbone`, `input_shape`, `num_classes` from
   the loaded graph -- never from the filename.
3. Behavioural fingerprint: run a fixed clean reference battery and
   record outputs; store the fingerprint so a later model can be
   compared to it.
4. Parameter statistics: weight mean/std per layer, dead neurons,
   and a comparison against a clean reference model's statistics.
5. Substitution check: compare the model SHA-256 against the
   reference model's digest; on mismatch, emit a high finding
   `model-substituted` and set `tamper_detected: true`.
6. Clean accuracy: only if a clean labelled set is supplied in
   `reference`; otherwise state it as a limitation, do not invent it.
7. Scoring: define it in this README before you code it, following
   the data-integrity pattern (penalty -> score ->
   pass/review/quarantine), and update the tests first.
8. White-box fallback: if `access_level` is `black-box`, run only
   input/output behaviour checks and state the white-box methods as
   `unsupported` -- do not pretend to have weight evidence.

## Do not change

- `backend/` or `frontend/` -- they are already wired to this
  service. Only change files inside this folder.
- The core response fields in `services/CONTRACT.md`.
" 