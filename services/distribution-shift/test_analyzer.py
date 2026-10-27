"""Tests for the distribution-shift service.

Run: python -m unittest test_analyzer -v  (from this folder)
"""

import json
import tempfile
import unittest
from pathlib import Path

from analyzer import analyze_distribution_shift


def _coco(tmp: str, car: int, truck: int) -> str:
    root = Path(tmp)
    (root / "images").mkdir(parents=True, exist_ok=True)
    images = []
    annotations = []
    for i in range(car + truck):
        images.append({"id": i + 1, "file_name": f"images/{i}.png"})
        category = 1 if i < car else 2
        annotations.append({"id": i + 1, "image_id": i + 1, "category_id": category, "bbox": [0, 0, 10, 10]})
    (root / "annotations.json").write_text(json.dumps({
        "images": images, "annotations": annotations,
        "categories": [{"id": 1, "name": "car"}, {"id": 2, "name": "truck"}],
    }))
    return tmp


class TestDistributionShift(unittest.TestCase):
    def test_missing_path_raises(self):
        with self.assertRaises(FileNotFoundError):
            analyze_distribution_shift("/no/such/dataset")

    def test_matching_distribution_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = analyze_distribution_shift(
                _coco(tmp, 5, 5),
                reference={"class_distribution": {"car": 0.5, "truck": 0.5}})
            self.assertEqual(result["status"], "pass")
            self.assertEqual(result["max_deviation"], 0.0)

    def test_shifted_distribution_quarantines(self):
        with tempfile.TemporaryDirectory() as tmp:
            # 19 car / 1 truck = 0.95 vs 0.50 reference: deviation 0.45 > 0.40.
            result = analyze_distribution_shift(
                _coco(tmp, 19, 1),
                reference={"class_distribution": {"car": 0.5, "truck": 0.5}})
            self.assertEqual(result["status"], "quarantine")
            self.assertGreater(result["max_deviation"], 0.20)

    def test_no_reference_is_review_not_pass(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = analyze_distribution_shift(_coco(tmp, 5, 5))
            self.assertEqual(result["status"], "review")


if __name__ == "__main__":
    unittest.main()
