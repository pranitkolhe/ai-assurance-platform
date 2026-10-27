"""Tests for the backdoor-assessment scaffold.

Run: python -m unittest test_analyzer -v  (from this folder)
"""

import tempfile
import unittest
from pathlib import Path

from analyzer import analyze_backdoor


class TestBackdoorScaffold(unittest.TestCase):
    def test_missing_path_raises(self):
        with self.assertRaises(FileNotFoundError):
            analyze_backdoor("/no/such/model.onnx")

    def test_onnx_file_reports_metadata_and_unavailable(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "model.onnx"
            path.write_bytes(b"fake-model-bytes")
            result = analyze_backdoor(str(path))
            self.assertEqual(result["domain"], "backdoor_assessment")
            # Never a fake "no backdoor" verdict.
            self.assertEqual(result["status"], "unavailable")
            self.assertIsNone(result["trigger_detected"])
            self.assertTrue(result["limitations"])


if __name__ == "__main__":
    unittest.main()
