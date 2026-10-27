# Distribution Shift Service (port 8105)

Standalone FastAPI service. Backend routes: `POST /api/v1/engines/distribution_shift/analyze`
and `GET /api/v1/distribution-shift/{assessment_id}/summary`. Contract: `services/CONTRACT.md`.

## What is implemented today (real, pure stdlib)

- Reads a COCO or YOLO dataset and counts class frequencies.
- Compares proportions to a reference `class_distribution` and
  reports `max_deviation`, `mean_deviation`, and drifted classes.
- Scoring: `score = 1 - max_deviation`. Status: pass (<= 0.20),
  review (<= 0.40), quarantine (> 0.40 or a reference class entirely
  absent).
- No reference supplied -> status `review`, not a pass, with the
  measured distribution returned and a limitation stating why.

## What is NOT implemented yet

- Embedding / feature distribution comparison (KS test,
  Wasserstein distance on real embeddings).
- Terrain / season / sensor / illumination metadata breakdowns.
- Drift-vs-manipulation rules beyond the class-level signal.
- Any p-value: class counts alone do not justify one, so none is
  reported. The old backend's fixed `wasserstein 0.042 / ks p-value
  0.38 / pass` has been removed and must not come back.

## Run and test live

```bash
cd services/distribution-shift
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8105
curl http://127.0.0.1:8105/health
curl -X POST http://127.0.0.1:8105/analyze -H "Content-Type: application/json" -d '{"dataset_path": "/absolute/path/to/dataset", "reference": {"class_distribution": {"car": 0.5, "truck": 0.5}}}'
python -m unittest test_analyzer -v
```

## TODO for the assignee (in order)

1. Add a real reference-profile format (class distribution plus
   embedding mean/covariance per class, plus metadata breakdowns)
   and document it here.
2. Implement embedding comparison (KS / Wasserstein) with
   `scipy` in this service only, calibrated against a clean
   reference -- define the thresholds in this README first.
3. Add drift-vs-manipulation rules and state them in
   `limitations` / `unsupported` in every result.
4. Keep the class-distribution check as the fallback when no
   embeddings are available; never hide that fallback.

## Do not change

- `backend/` or `frontend/` -- they are already wired to this
  service. Only change files inside this folder.
- The core response fields in `services/CONTRACT.md`.
