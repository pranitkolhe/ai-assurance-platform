"""Tests for the inference-provenance service.

Run: python -m unittest test_analyzer -v  (from this folder)
"""

import hashlib
import unittest

from analyzer import verify_provenance


def _manifest(output_hash="out-1"):
    binding = hashlib.sha256(
        ("in-1" + "model-1" + "cfg-1" + output_hash).encode()).hexdigest()
    return {
        "input_hash": "in-1", "model_digest": "model-1",
        "config_hash": "cfg-1", "output_hash": output_hash,
        "binding_hash": binding, "sequence": 1,
        "timestamp": "2026-10-25T00:00:00Z", "nonce": "abc123",
    }


class TestProvenance(unittest.TestCase):
    def test_valid_manifest_passes(self):
        result = verify_provenance(_manifest())
        self.assertEqual(result["status"], "pass")
        self.assertTrue(result["verified"])
        self.assertFalse(result["tamper_detected"])

    def test_tampered_output_quarantines(self):
        manifest = _manifest()
        manifest["output_hash"] = "tampered"
        result = verify_provenance(manifest)
        self.assertEqual(result["status"], "quarantine")
        self.assertTrue(result["tamper_detected"])

    def test_missing_fields_review(self):
        result = verify_provenance({"input_hash": "in-1"})
        self.assertEqual(result["status"], "review")

    def test_replay_detected(self):
        result = verify_provenance(
            _manifest(), reference={"seen_sequences": [1]})
        self.assertEqual(result["status"], "quarantine")
        self.assertTrue(result["replay_detected"])


if __name__ == "__main__":
    unittest.main()
