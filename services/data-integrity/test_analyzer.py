"""Tests for analyzer.py using only temporary, synthetic datasets."""

import json
import struct
import tempfile
import unittest
import zlib
from pathlib import Path

from analyzer import analyze_dataset


def _png_bytes(width: int, height: int, seed: int) -> bytes:
    signature = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr = struct.pack(">I", 13) + b"IHDR" + ihdr_data
    ihdr += struct.pack(">I", zlib.crc32(b"IHDR" + ihdr_data) & 0xFFFFFFFF)
    body = bytes([seed]) * 16
    idat = struct.pack(">I", len(body)) + b"IDAT" + body
    idat += struct.pack(">I", zlib.crc32(b"IDAT" + body) & 0xFFFFFFFF)
    iend = struct.pack(">I", 0) + b"IEND"
    iend += struct.pack(">I", zlib.crc32(b"IEND") & 0xFFFFFFFF)
    return signature + ihdr + idat + iend


def _coco_dataset(root: Path) -> Path:
    images_dir = root / "images"
    images_dir.mkdir(parents=True)
    (images_dir / "a.png").write_bytes(_png_bytes(100, 80, 1))
    # Same content as a.png, but a different label: the poisoning signal.
    (images_dir / "b.png").write_bytes(_png_bytes(100, 80, 1))
    (images_dir / "c.png").write_bytes(_png_bytes(100, 80, 2))
    data = {
        "images": [
            {"id": 1, "file_name": "images/a.png"},
            {"id": 2, "file_name": "images/b.png"},
            {"id": 3, "file_name": "images/c.png"},
            {"id": 4, "file_name": "images/missing.png"},
        ],
        "annotations": [
            {"id": 1, "image_id": 1, "category_id": 1, "bbox": [10, 10, 20, 20]},
            {"id": 2, "image_id": 2, "category_id": 2, "bbox": [10, 10, 20, 20]},
            {"id": 3, "image_id": 3, "category_id": 1, "bbox": [10, 10, -5, 20]},
            {"id": 4, "image_id": 99, "category_id": 1, "bbox": [0, 0, 10, 10]},
        ],
        "categories": [
            {"id": 1, "name": "car"},
            {"id": 2, "name": "truck"},
        ],
    }
    annotation_path = root / "annotations.json"
    annotation_path.write_text(json.dumps(data), encoding="utf-8")
    return annotation_path


class TestCocoAnalyzer(unittest.TestCase):
    def test_duplicate_label_flip_invalid_and_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            annotation_path = _coco_dataset(root)
            result = analyze_dataset(str(annotation_path), "COCO")
            self.assertEqual(result["format"], "COCO")
            self.assertEqual(result["total_images"], 4)
            self.assertEqual(result["total_annotations"], 4)
            self.assertGreaterEqual(result["duplicate_count"], 1)
            self.assertEqual(result["missing_files_count"], 1)
            self.assertGreaterEqual(result["invalid_annotations_count"], 2)
            titles = [f["title"] for f in result["findings"]]
            self.assertIn("Same image content with different labels", titles)
            self.assertEqual(result["status"], "quarantine")
            self.assertLess(result["score"], 0.75)

    def test_clean_dataset_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            images_dir = root / "images"
            images_dir.mkdir(parents=True)
            (images_dir / "a.png").write_bytes(_png_bytes(100, 80, 1))
            data = {
                "images": [{"id": 1, "file_name": "images/a.png"}],
                "annotations": [{"id": 1, "image_id": 1, "category_id": 1,
                                "bbox": [10, 10, 20, 20]}],
                "categories": [{"id": 1, "name": "car"}],
            }
            annotation_path = root / "annotations.json"
            annotation_path.write_text(json.dumps(data), encoding="utf-8")
            result = analyze_dataset(str(annotation_path), "COCO")
            self.assertEqual(result["status"], "pass")
            self.assertEqual(result["duplicate_count"], 0)
            self.assertEqual(result["invalid_annotations_count"], 0)

    def test_missing_path_raises(self) -> None:
        with self.assertRaises(FileNotFoundError):
            analyze_dataset("/definitely/not/a/dataset", "COCO")


if __name__ == "__main__":
    unittest.main()
