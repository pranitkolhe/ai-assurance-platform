"""Inference-provenance verification -- REAL binding check, partial crypto.

What is implemented today (real, tested):
  - Binding recomputation: binding_hash must equal
    SHA-256(input_hash + model_digest + config_hash + output_hash),
    concatenated in that order, hex-encoded. Any altered input,
    model, config, or output changes the binding, so a mismatch is
    a tamper finding (critical).
  - Required-field checks: input_hash, model_digest, config_hash,
    output_hash, and binding_hash must all be present and non-empty.
  - Sequence / timestamp / nonce presence checks: a manifest with
    no sequence, no timestamp, or no nonce cannot be checked for
    replay, so that is stated as a limitation, not passed silently.
  - Optional asset check: if asset_path is given, its SHA-256 is
    computed and compared with input_hash / asset_sha256 in the
    manifest; a mismatch is a tamper finding.
  - Optional replay check: if reference contains
    "seen_sequences" (a list of already-seen sequence numbers),
    a repeated sequence is a replay finding (high).

What is NOT implemented yet (the assignee's work, see README.md):
  - Ed25519 signature verification (needs the `cryptography`
    package and a real signing-key registry -- the old backend
    hard-coded a fake signature, which this service does not do).
  - A persistent, tamper-evident sequence / nonce store (the
    backend database must own that; this service is stateless).
  - Timestamp freshness / clock-skew policy.

Scoring: verified and no findings -> pass, score 1.0.
Missing replay controls -> review, score 0.5 (verified binding, but
replay cannot be ruled out). Any tamper / replay finding ->
quarantine, score 0.0. Confidence is 1.0 when all binding inputs
were present, otherwise 0.5.
"""

from __future__ import annotations

import hashlib
from pathlib import Path


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def _binding(input_hash: str, model_digest: str, config_hash: str,
             output_hash: str) -> str:
    material = (input_hash + model_digest + config_hash + output_hash).encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def _finding(finding_id: str, title: str, severity: str, reason: str,
             evidence: dict) -> dict:
    return {"id": finding_id, "title": title, "severity": severity,
            "reason": reason, "evidence": evidence, "affected_assets": []}


def verify_provenance(manifest: dict, asset_path: str | None = None,
                      reference: dict | None = None) -> dict:
    if not isinstance(manifest, dict):
        raise ValueError("A manifest object is required")
    findings: list[dict] = []
    limitations = [
        "Ed25519 signature verification is not yet implemented: "
        "a manifest's signature, if present, is not checked here. "
        "Do not treat 'verified' as 'cryptographically signed' "
        "until the signature step in README.md is done.",
        "Replay protection is only as good as the caller's "
        "seen_sequences list: this service is stateless and does "
        "not store sequences itself.",
    ]
    required = ["input_hash", "model_digest", "config_hash", "output_hash", "binding_hash"]
    missing = [field for field in required if not manifest.get(field)]
    if missing:
        findings.append(_finding(
            "missing-binding-fields", "Manifest is missing binding fields", "high",
            "The manifest cannot be verified without all binding fields.",
            {"missing_fields": missing}))
    expected = None
    tamper = False
    if not missing:
        expected = _binding(str(manifest["input_hash"]), str(manifest["model_digest"]),
                            str(manifest["config_hash"]), str(manifest["output_hash"]))
        if str(manifest["binding_hash"]) != expected:
            tamper = True
            findings.append(_finding(
                "binding-mismatch", "Binding hash does not match recomputed binding", "critical",
                "At least one of input, model, config, or output was "
                "altered or substituted after the manifest was created.",
                {"expected_binding_hash": expected,
                 "claimed_binding_hash": str(manifest["binding_hash"])}))
    if asset_path:
        asset = Path(asset_path)
        if not asset.is_file():
            raise FileNotFoundError(f"Asset path does not exist: {asset_path}")
        actual = _sha256_file(asset)
        claimed = manifest.get("input_hash") or manifest.get("asset_sha256")
        if claimed and str(claimed) != actual:
            tamper = True
            findings.append(_finding(
                "asset-hash-mismatch", "Asset file hash does not match the manifest", "critical",
                "The file on disk is not the file the manifest describes.",
                {"actual_sha256": actual, "claimed_sha256": str(claimed)}))
    replay = False
    if reference and isinstance(reference.get("seen_sequences"), list):
        sequence = manifest.get("sequence")
        if sequence is not None and sequence in reference["seen_sequences"]:
            replay = True
            findings.append(_finding(
                "replay-detected", "Sequence number was already seen", "high",
                "This inference record may be a replay of an earlier record.",
                {"sequence": sequence}))
    has_replay_controls = bool(manifest.get("sequence") is not None
                               and manifest.get("timestamp")
                               and manifest.get("nonce"))
    if not has_replay_controls:
        limitations.append(
            "Manifest has no complete sequence / timestamp / nonce, "
            "so replay cannot be ruled out.")
    if tamper or replay:
        status, score = "quarantine", 0.0
    elif missing:
        status, score = "review", 0.5
    elif not has_replay_controls:
        status, score = "review", 0.5
    else:
        status, score = "pass", 1.0
    confidence = 1.0 if not missing else 0.5
    return {
        "domain": "inference_provenance",
        "status": status,
        "score": score,
        "confidence": confidence,
        "verified": status == "pass",
        "binding_hash": manifest.get("binding_hash"),
        "expected_binding_hash": expected,
        "tamper_detected": tamper,
        "replay_detected": replay,
        "findings": findings,
        "limitations": limitations,
        "unsupported": ["Ed25519 signature verification", "Persistent sequence store"],
    }
