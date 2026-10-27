"""Model-integrity analysis -- SCAFFOLD, not yet a full implementation.

What is implemented today (real, tested):
  - File existence, size, and SHA-256 digest.
  - Format detection from the file extension (.onnx, .pt, .pth,
    .torchscript) -- this is a filename hint only, not a parse.

What is NOT implemented yet (the assignee's work, see README.md):
  1. Load the model with onnxruntime (ONNX) or torch (TorchScript).
  2. Behavioural fingerprinting: run a fixed reference battery of
     clean inputs and record outputs / activations.
  3. Parameter / activation statistics: weight distribution, dead
     neurons, anomalous layers vs a clean reference model.
  4. Substitution detection: compare the weight digest against the
     reference model's digest; a mismatch is a substitution signal.
  5. Clean accuracy on a held-out clean set (only if one is given).

Until those steps are implemented, this returns status "unavailable"
with a limitation -- never a fake pass. The backend turns that into
HTTP 503, so the UI cannot mistake it for a clean model.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

_FORMATS = {
    ".onnx": "ONNX",
    ".pt": "PyTorch",
    ".pth": "PyTorch",
    ".torchscript": "TorchScript",
}


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def analyze_model(model_path: str, format_hint: str | None = None,
                  reference: dict | None = None,
                  access_level: str | None = None) -> dict:
    """Analyse a model file. Returns the contract result dict."""
    root = Path(model_path)
    if not root.exists() or not root.is_file():
        raise FileNotFoundError(f"Model path does not exist: {model_path}")
    fmt = (format_hint or _FORMATS.get(root.suffix.lower(), "unknown"))
    if fmt == "unknown":
        raise ValueError(
            f"Unsupported model format for file: {root.name} "
            "(expected .onnx, .pt, .pth or .torchscript)")
    return {
        "domain": "model_integrity",
        "status": "unavailable",
        "score": 0.0,
        "confidence": 0.0,
        "format": fmt,
        "model_sha256": _sha256_file(root),
        "model_size_bytes": root.stat().st_size,
        "backbone": None,
        "input_shape": None,
        "num_classes": None,
        "tamper_detected": None,
        "clean_accuracy": None,
        "backdoor_risk": None,
        "findings": [],
        "limitations": [
            "Model-integrity analysis is not yet implemented: "
            "this service currently only reports file metadata "
            "(size, SHA-256, extension). Loading, fingerprinting, "
            "parameter statistics, substitution checks and clean "
            "accuracy require torch / onnxruntime -- see README.md "
            "TODO list. No pass/fail verdict is given until then.",
        ],
        "unsupported": [
            "Behavioural fingerprinting",
            "Parameter / activation statistics",
            "Substitution detection against a reference digest",
            "Clean accuracy measurement",
        ],
    }
