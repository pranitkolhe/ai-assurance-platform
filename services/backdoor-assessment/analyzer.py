"""Backdoor assessment -- SCAFFOLD, not yet a full implementation.

What is implemented today (real, tested):
  - File existence, size, and SHA-256 digest of the model.

What is NOT implemented yet (the assignee's work, see README.md):
  1. Load the model and run it on a clean reference battery.
  2. Trigger search / reconstruction: optimise a small patch that
     flips many inputs to one target class (the classic backdoor
     signature is a small trigger with a high attack success rate).
  3. Activation analysis: look for neurons / channels that fire
     only on triggered inputs.
  4. Report attack_success_rate and clean_accuracy measured on
     real runs -- never guessed.

Until those steps are implemented, this returns status "unavailable"
with a limitation -- never a fake "no backdoor found". A clean verdict
for backdoors is the most dangerous fake result in this project.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

_FORMATS = {".onnx": "ONNX", ".pt": "PyTorch", ".pth": "PyTorch",
            ".torchscript": "TorchScript"}


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def analyze_backdoor(model_path: str, clean_dataset_path: str | None = None,
                     reference: dict | None = None,
                     access_level: str | None = None) -> dict:
    root = Path(model_path)
    if not root.exists() or not root.is_file():
        raise FileNotFoundError(f"Model path does not exist: {model_path}")
    if root.suffix.lower() not in _FORMATS:
        raise ValueError(
            f"Unsupported model format for file: {root.name} "
            "(expected .onnx, .pt, .pth or .torchscript)")
    return {
        "domain": "backdoor_assessment",
        "status": "unavailable",
        "score": 0.0,
        "confidence": 0.0,
        "model_sha256": _sha256_file(root),
        "model_size_bytes": root.stat().st_size,
        "trigger_detected": None,
        "target_class": None,
        "attack_success_rate": None,
        "clean_accuracy": None,
        "findings": [],
        "limitations": [
            "Backdoor assessment is not yet implemented: this service "
            "currently only reports model file metadata. Trigger "
            "search, activation analysis and measured attack success "
            "rate require torch / onnxruntime and a clean reference "
            "battery -- see README.md TODO list. No 'no backdoor' "
            "verdict is given until then.",
        ],
        "unsupported": [
            "Trigger search / reconstruction",
            "Activation analysis",
            "Measured attack success rate",
            "Clean accuracy on a reference battery",
        ],
    }
