"""Resolve asset file paths before sending them to a service.

Root cause of the 2026-10-27 8101 404 / backend 503: older uploads
stored a RELATIVE file_path ("data/uploads/<id>_file"). The backend
started in backend/ could see that path, but a service started in
services/data-integrity/ resolved the same relative string under
its own folder, found nothing, and returned 404. The backend then
reported 503 and the frontend said "service not running" even
though 8101 was running fine.

New uploads store an absolute path (see app/config.py), so this
helper is mainly for older rows. It returns the first candidate
that actually exists, so an old relative row still works without
a database migration:
  1. backend/data/...  (where the backend actually stored it)
  2. project-root/data/...  (the other historical location)
  3. current-working-directory/...  (last resort)
If none exists, it returns the backend-anchored absolute path, so
the service's 404 message names the real attempted path instead
of an ambiguous relative one.
"""

from __future__ import annotations

from pathlib import Path

# paths.py lives in backend/app/engines/:
# parents[0] = engines, [1] = app, [2] = backend, [3] = project root.
_BACKEND_DIR = Path(__file__).resolve().parents[2]
_PROJECT_ROOT = Path(__file__).resolve().parents[3]


def resolve_engine_path(stored_path: str) -> str:
    path = Path(stored_path)
    if path.is_absolute():
        return str(path)
    candidates = [
        _BACKEND_DIR / path,
        _PROJECT_ROOT / path,
        Path.cwd() / path,
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    return str(candidates[0])
