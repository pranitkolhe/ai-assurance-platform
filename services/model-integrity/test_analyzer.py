"""Tests for the model-integrity scaffold.

Run: python -m unittest test_analyzer -v  (from this folder)
"""

import tempfile
import unittest
from pathlib import Path

from analyzer import analyze_model


class TestModelIntegrityScaffold(unittest.TestCase):
    def test_missing_path_raises(self):
        with self.assertRaises(FileNotFoundError):
            analyze_model("/no/such/model.onnx")

    def test_unsupported_format_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "model.txt"
            path.write_text("not a model")
            with self.assertRaises(ValueError):
                analyze_model(str(path))

    def test_onnx_file_reports_metadata_and_unavailable(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "model.onnx"
            path.write_bytes(b"fake-onnx-bytes")
            result = analyze_model(str(path))
            self.assertEqual(result["domain"], "model_integrity")
            # Scaffold honesty: no fake pass, but real metadata.
            self.assertEqual(result["status"], "unavailable")
            self.assertEqual(result["format"], "ONNX")
            self.assertEqual(result["model_size_bytes"], len(b"fake-onnx-bytes"))
            self.assertEqual(len(result["model_sha256"]), 64)
            self.assertTrue(result["limitations"])


if __name__ == "__main__":
    unittest.main()
