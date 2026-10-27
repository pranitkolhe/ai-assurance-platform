# Backdoor Assessment Service (port 8103)

Standalone FastAPI service. Backend routes: `POST /api/v1/engines/backdoor_assessment/analyze`
and `GET /api/v1/backdoor/{asset_id}/assessment`. Contract: `services/CONTRACT.md`.

## Status today: scaffold, not a verdict

`analyzer.py` only reports model file metadata and returns
`status: "unavailable"`. That is intentional -- a fake "no backdoor
found" is the most dangerous result this project could produce.

## Run and test live

```bash
cd services/backdoor-assessment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8103
curl http://127.0.0.1:8103/health
curl -X POST http://127.0.0.1:8103/analyze -H "Content-Type: application/json" -d '{"model_path": "/absolute/path/to/model.onnx", "clean_dataset_path": "/absolute/path/to/clean/dataset"}'
python -m unittest test_analyzer -v
```

## TODO for the assignee (in order)

1. Add `torch` and `onnxruntime` to `requirements.txt` (this service only).
2. Load the model and run a clean reference battery; record clean
   accuracy and per-class behaviour as the baseline.
3. Trigger search: optimise a small patch (bounded size, bounded
   magnitude) that flips a large fraction of clean inputs to a
   single target class. Report the patch size, target class, and
   measured attack success rate.
4. Activation analysis: find neurons/channels that fire strongly
   on triggered inputs but rarely on clean inputs.
5. Scoring: a small trigger + high attack success rate + low clean
   accuracy drop = quarantine (critical finding `trigger-detected`).
   Define the thresholds in this README before coding them, and
   state them in `limitations` / `unsupported` in every result.
6. Test with a team-generated trojaned model and a clean model --
   both must be team-generated, per the SIH statement; do not claim
   an external benchmark unless it is actually shipped.
7. Black-box fallback: if only inputs/outputs are available,
   trigger search can still run behaviourally; activation analysis
   must be listed as `unsupported`, not faked.

## Do not change

- `backend/` or `frontend/` -- they are already wired to this
  service. Only change files inside this folder.
- The core response fields in `services/CONTRACT.md`.
