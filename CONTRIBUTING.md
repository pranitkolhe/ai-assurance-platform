# Contributing

## Who works on what

| Area | Folder | Who |
|---|---|---|
| Data integrity | `services/data-integrity/` | Done -- do not rewrite without a reason |
| Model integrity | `services/model-integrity/` | Assignee: implement `analyzer.py` |
| Backdoor assessment | `services/backdoor-assessment/` | Assignee: implement `analyzer.py` |
| Inference provenance | `services/inference-provenance/` | Assignee: Ed25519 signatures + sequence store |
| Distribution shift | `services/distribution-shift/` | Assignee: embedding-based shift |
| Backend core | `backend/` | Owner only -- service authors do not edit |
| Frontend | `frontend/` | Owner only -- service authors do not edit |

If two people need the same backend change, open an issue first
and let the owner make it once, in one place.

## Workflow for a service author

1. Fork / clone, then read `services/CONTRACT.md` and your
   service's README (it has your TODO list, in order).
2. Create a branch named after your service, e.g.
   `service/model-integrity` or `service/backdoor`.
3. Work ONLY inside your service folder. Do not edit `backend/`,
   `frontend/`, or another service's folder.
4. Keep the contract: same `GET /health`, `GET /`,
   `POST /analyze`, same core response fields, same status
   values (`pass | review | quarantine | unavailable`).
5. Write the test first for any new check, in
   `test_analyzer.py`, and make it pass locally:
   `python -m unittest test_analyzer -v`
6. Test live, without the backend, then through the backend:

```bash
# direct
uvicorn main:app --host 127.0.0.1 --port <your-port>
curl http://127.0.0.1:<your-port>/health
curl -X POST http://127.0.0.1:<your-port>/analyze -H "Content-Type: application/json" -d '{"path": "/absolute/path/to/test/asset"}'

# through the backend (backend on :8000, your service running)
curl http://127.0.0.1:8000/api/v1/engines/status
curl -X POST http://127.0.0.1:8000/api/v1/engines/<your-domain>/analyze -H "Content-Type: application/json" -d '{"path": "/absolute/path/to/test/asset"}'
```

7. Update your service's README: what is implemented, what is
   still a limitation, and the exact scoring thresholds you used.
8. Open a pull request with: what changed (only your folder),
   the live curl output for a clean case and a poisoned case,
   and the test output.

## Pull-request checklist

- [ ] Only my service folder changed (check with `git status`).
- [ ] `python -m unittest test_analyzer -v` passes.
- [ ] `GET /health` returns `{"status": "ok"}`.
- [ ] A clean case and a poisoned case were both tested live,
      and both outputs are pasted in the PR description.
- [ ] No fake results: an unimplemented check returns
      `unavailable` with a limitation, not a pass.
- [ ] Every result states its limitations and unsupported attacks.
- [ ] No secrets, no `.env`, no `venv/`, no `__pycache__/`,
      no uploaded datasets/models in the PR.
- [ ] README updated for the service.

## Rules that are not negotiable

- Never return a pass for something you did not analyse.
- Never hard-code a score, a verdict, a signature, or a model
  name. Every number must be computed from the input files.
- Never add a cloud / external API call to a service. This
  project must work offline / air-gapped.
- Never commit credentials, tokens, or private keys.
- If the backend contract is wrong for your domain, say so in
  the PR / issue -- do not silently change the backend.
