"""Real dataset-integrity analysis for COCO and YOLO datasets.

Pure standard-library code: no PIL, no torch, no network access. Every
number in the result is computed from the files on disk, never hard-coded.

What this module does NOT claim to do (stated as limitations in the
result): model-based label-noise detection, perceptual near-duplicate
detection for resized/re-encoded images, and detection of a trigger that
is invisible in the annotations. Those need a model or a perceptual
hash, which are Phase 2 / later work.
"""

from __future__ import annotations

import hashlib
import json
import struct
from collections import Counter, defaultdict
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def _png_dimensions(data: bytes) -> tuple[int, int] | None:
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    if data[12:16] != b"IHDR":
        return None
    width, height = struct.unpack(">II", data[16:24])
    return (width, height) if width > 0 and height > 0 else None


def _jpeg_dimensions(data: bytes) -> tuple[int, int] | None:
    if len(data) < 4 or data[:2] != b"\xff\xd8":
        return None
    index = 2
    sof_markers = {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                   0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}
    while index + 4 <= len(data):
        if data[index] != 0xFF:
            index += 1
            continue
        marker = data[index + 1]
        if marker in (0xD8, 0xD9, 0x01) or 0xD0 <= marker <= 0xD7:
            index += 2
            continue
        length = struct.unpack(">H", data[index + 2:index + 4])[0]
        if length < 2 or index + 2 + length > len(data):
            return None
        if marker in sof_markers and length >= 7:
            height, width = struct.unpack(
                ">HH", data[index + 5:index + 9])
            return (width, height) if width > 0 and height > 0 else None
        index += 2 + length
    return None


def _gif_dimensions(data: bytes) -> tuple[int, int] | None:
    if len(data) < 10 or data[:6] not in (b"GIF87a", b"GIF89a"):
        return None
    width, height = struct.unpack("<HH", data[6:10])
    return (width, height) if width > 0 and height > 0 else None


def image_dimensions(path: Path) -> tuple[int, int] | None:
    """Best-effort dimensions from PNG/JPEG/GIF headers, else None."""
    try:
        with path.open("rb") as handle:
            data = handle.read(1024 * 1024)
    except OSError:
        return None
    for parser in (_png_dimensions, _jpeg_dimensions, _gif_dimensions):
        dimensions = parser(data)
        if dimensions is not None:
            return dimensions
    return None


def _finding(finding_id: str, title: str, severity: str, reason: str,
             evidence: dict, affected: list[str]) -> dict:
    return {
        "id": finding_id,
        "title": title,
        "severity": severity,
        "reason": reason,
        "evidence": evidence,
        "affected_assets": affected[:5],
    }


def _reference_checks(class_dist: Counter, total_annotations: int,
                      reference: dict | None) -> tuple[list[dict], float, int, float]:
    """Compare class distribution to an optional reference profile.

    Returns (findings, penalty, unknown_category_count, max_deviation).
    """
    findings: list[dict] = []
    penalty = 0.0
    unknown_count = 0
    max_deviation = 0.0
    if not reference:
        return findings, penalty, unknown_count, max_deviation
    schema = reference.get("class_schema") or reference.get("classes")
    if schema:
        schema_names = [str(item) for item in schema]
        unknown_names = sorted(set(class_dist) - set(schema_names))
        unknown_count = sum(class_dist[name] for name in unknown_names)
        if unknown_names:
            findings.append(_finding(
                "unknown-classes", "Categories outside the reference schema",
                "high",
                "These categories do not exist in the declared reference "
                "schema, so they are out-of-distribution for this task.",
                {"unknown_categories": unknown_names[:10],
                 "unknown_annotations": unknown_count},
                unknown_names[:5]))
            penalty += 0.15
        missing = [name for name in schema_names if class_dist.get(name, 0) == 0]
        if missing:
            findings.append(_finding(
                "missing-reference-classes",
                "Reference categories with no samples", "low",
                "Some categories from the reference schema have no samples "
                "in this dataset.",
                {"missing_categories": missing[:10]}, []))
    ref_dist = reference.get("class_distribution")
    if ref_dist and total_annotations > 0:
        total_ref = float(sum(float(v) for v in ref_dist.values()))
        if total_ref > 0:
            for name, ref_value in ref_dist.items():
                expected = float(ref_value) / total_ref
                actual = class_dist.get(str(name), 0) / total_annotations
                max_deviation = max(max_deviation, abs(actual - expected))
            if max_deviation > 0.20:
                findings.append(_finding(
                    "distribution-deviation",
                    "Class distribution deviates from the reference", "high",
                    "The largest per-class proportion differs from the "
                    "reference by more than 0.20, which is material drift "
                    "or a systematic labelling change.",
                    {"max_proportion_deviation": round(max_deviation, 4)},
                    []))
                penalty += 0.10
    return findings, penalty, unknown_count, max_deviation


def _penalty(duplicate_rate: float, missing_rate: float,
             invalid_rate: float, has_critical: bool,
             reference_penalty: float) -> float:
    value = reference_penalty
    if has_critical:
        value += 0.35
    value += min(0.25, duplicate_rate * 0.5)
    value += min(0.25, invalid_rate)
    value += min(0.30, missing_rate)
    return min(0.95, value)


def _build_result(fmt: str, total_images: int, total_annotations: int,
                  duplicate_count: int, corrupt_count: int,
                  missing_count: int, invalid_count: int,
                  class_dist: Counter, source_risk: list[dict],
                  findings: list[dict], limitations: list[str],
                  files_found: int, penalty: float) -> dict:
    score = round(max(0.0, 1.0 - penalty), 4)
    has_critical = any(f["severity"] == "critical" for f in findings)
    has_high = any(f["severity"] == "high" for f in findings)
    if has_critical or score < 0.40:
        status = "quarantine"
    elif has_high or score < 0.75:
        status = "review"
    else:
        status = "pass"
    if total_images > 0:
        confidence = round(files_found / total_images, 4)
    else:
        confidence = 0.0
    if files_found == 0 and total_images > 0:
        limitations.append(
            "No image files were found on disk, so content, duplicate "
            "and dimension checks were skipped; only annotation checks ran.")
    return {
        "domain": "data_integrity",
        "format": fmt,
        "status": status,
        "score": score,
        "confidence": confidence,
        "total_images": total_images,
        "total_annotations": total_annotations,
        "duplicate_count": duplicate_count,
        "corrupt_samples_count": corrupt_count,
        "missing_files_count": missing_count,
        "invalid_annotations_count": invalid_count,
        "class_distribution": dict(sorted(class_dist.items())),
        "source_risk": source_risk,
        "findings": findings,
        "limitations": limitations,
    }


def _failed_result(fmt: str, reason: str) -> dict:
    return {
        "domain": "data_integrity",
        "format": fmt,
        "status": "quarantine",
        "score": 0.0,
        "confidence": 0.0,
        "total_images": 0,
        "total_annotations": 0,
        "duplicate_count": 0,
        "corrupt_samples_count": 0,
        "missing_files_count": 0,
        "invalid_annotations_count": 0,
        "class_distribution": {},
        "source_risk": [],
        "findings": [_finding(
            "unreadable-dataset", "Dataset could not be analysed",
            "critical", reason, {}, [])],
        "limitations": [],
    }


def _source_risk_table(stats: dict[str, dict]) -> list[dict]:
    rows = []
    for source in sorted(stats):
        item = stats[source]
        total = item["total"]
        rows.append({
            "source": source,
            "total_images": total,
            "duplicate_images": item["duplicates"],
            "missing_files": item["missing"],
            "invalid_annotations": item["invalid"],
            "duplicate_rate": round(item["duplicates"] / total, 4) if total else 0.0,
            "missing_rate": round(item["missing"] / total, 4) if total else 0.0,
        })
    return rows


def _detect_format(root: Path) -> str:
    if root.is_file():
        if root.suffix.lower() == ".json":
            return "COCO"
        raise ValueError(f"Unsupported dataset file: {root.name}")
    candidates = []
    for folder in (root, root / "annotations"):
        if folder.is_dir():
            candidates.extend(sorted(folder.glob("*.json")))
    for path in candidates:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if isinstance(data, dict) and "images" in data and "annotations" in data:
            return "COCO"
    if (root / "labels").is_dir() or list(root.rglob("*.txt")):
        return "YOLO"
    raise ValueError(
        "Could not detect dataset format: expected a COCO JSON file "
        "(images + annotations) or a YOLO labels directory.")


def _analyze_coco(root: Path, reference: dict | None) -> dict:
    if root.is_file():
        annotation_path, dataset_dir = root, root.parent
    else:
        dataset_dir = root
        annotation_path = None
        for folder in (root, root / "annotations"):
            if not folder.is_dir():
                continue
            for path in sorted(folder.glob("*.json")):
                try:
                    data = json.loads(path.read_text(encoding="utf-8"))
                except (OSError, ValueError):
                    continue
                if isinstance(data, dict) and "images" in data and "annotations" in data:
                    annotation_path = path
                    break
            if annotation_path is not None:
                break
        if annotation_path is None:
            return _failed_result("COCO", "No COCO annotation JSON file was found.")
    try:
        data = json.loads(annotation_path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        return _failed_result("COCO", f"Annotation JSON could not be read: {exc}")
    images = data.get("images") if isinstance(data.get("images"), list) else []
    annotations = data.get("annotations") if isinstance(data.get("annotations"), list) else []
    categories = data.get("categories") if isinstance(data.get("categories"), list) else []
    findings: list[dict] = []
    limitations = [
        "Label-noise detection here is annotation-based only: same content "
        "with different labels, unknown categories, and invalid boxes are "
        "flagged. Model-based label-noise detection is not implemented.",
        "Near-duplicate detection is exact-content (SHA-256) only; "
        "resized or re-encoded copies are not detected.",
    ]
    cat_map: dict = {}
    duplicate_categories: list[str] = []
    for category in categories:
        if not isinstance(category, dict) or "id" not in category:
            continue
        if category["id"] in cat_map:
            duplicate_categories.append(str(category["id"]))
        else:
            cat_map[category["id"]] = str(category.get("name", category["id"]))
    image_map: dict = {}
    duplicate_image_ids: list[str] = []
    for image in images:
        if not isinstance(image, dict) or "id" not in image:
            continue
        if image["id"] in image_map:
            duplicate_image_ids.append(str(image["id"]))
        else:
            image_map[image["id"]] = image
    if duplicate_categories:
        findings.append(_finding(
            "duplicate-categories", "Duplicate category ids", "high",
            "The same category id is defined more than once.",
            {"duplicate_category_ids": duplicate_categories[:10]}, []))
    if duplicate_image_ids:
        findings.append(_finding(
            "duplicate-image-ids", "Duplicate image ids", "high",
            "The same image id appears more than once.",
            {"duplicate_image_ids": duplicate_image_ids[:10]}, []))
    anns_by_image: dict = defaultdict(list)
    for ann in annotations:
        if isinstance(ann, dict) and "image_id" in ann:
            anns_by_image[ann["image_id"]].append(ann)
    source_stats: dict[str, dict] = defaultdict(
        lambda: {"total": 0, "duplicates": 0, "missing": 0, "invalid": 0})
    hash_to_images: dict[str, list[dict]] = defaultdict(list)
    dimensions_by_id: dict = {}
    missing_examples: list[str] = []
    corrupt_count = 0
    missing_count = 0
    files_found = 0
    for image_id, image in image_map.items():
        file_name = str(image.get("file_name", ""))
        parent = Path(file_name).parent.name
        source = str(image.get("source") or image.get("contributor")
                      or image.get("batch") or (parent if parent != "." else "unknown"))
        source_stats[source]["total"] += 1
        candidates = [
            dataset_dir / file_name,
            dataset_dir / "images" / file_name,
            dataset_dir / "images" / Path(file_name).name,
        ]
        found = next((p for p in candidates if p.is_file()), None)
        if found is None:
            missing_count += 1
            source_stats[source]["missing"] += 1
            if len(missing_examples) < 5:
                missing_examples.append(file_name or str(image_id))
            continue
        files_found += 1
        if found.stat().st_size == 0:
            corrupt_count += 1
        try:
            digest = _sha256_file(found)
        except OSError:
            corrupt_count += 1
            continue
        hash_to_images[digest].append(image)
        dimensions_by_id[image_id] = image_dimensions(found)
    duplicate_count = 0
    critical_same_content = False
    duplicate_examples: list[str] = []
    for digest, group in hash_to_images.items():
        if len(group) < 2:
            continue
        duplicate_count += len(group) - 1
        names = [str(item.get("file_name", "")) for item in group]
        duplicate_examples.extend(names)
        for item in group[1:]:
            parent = Path(str(item.get("file_name", ""))).parent.name
            source = str(item.get("source") or item.get("contributor")
                        or item.get("batch") or (parent if parent != "." else "unknown"))
            source_stats[source]["duplicates"] += 1
        label_sets = []
        for item in group:
            label_sets.append(frozenset(
                ann.get("category_id") for ann in anns_by_image.get(item["id"], [])
                if isinstance(ann, dict)))
        if len(set(label_sets)) > 1:
            critical_same_content = True
    if duplicate_count > 0:
        findings.append(_finding(
            "duplicate-content", "Duplicate image content", "high",
            "Multiple dataset entries have identical file content "
            "(SHA-256). This is duplicate flooding unless intended.",
            {"duplicate_extra_copies": duplicate_count},
            duplicate_examples[:5]))
    if critical_same_content:
        findings.append(_finding(
            "same-content-different-labels",
            "Same image content with different labels", "critical",
            "Identical image files carry different category labels. "
            "This is a strong label-flipping / poisoning signal.",
            {}, []))
    if missing_count > 0:
        findings.append(_finding(
            "missing-image-files", "Annotation images missing from disk",
            "high", "Annotated images have no file on disk.",
            {"missing_files": missing_count}, missing_examples))
    if corrupt_count > 0:
        findings.append(_finding(
            "corrupt-samples", "Empty or unreadable image files", "high",
            "Some image files are empty or could not be read.",
            {"corrupt_samples": corrupt_count}, []))
    invalid_count = 0
    unknown_image_examples: list[str] = []
    unknown_category_examples: list[str] = []
    invalid_bbox_examples: list[str] = []
    class_dist: Counter = Counter()
    for ann in annotations:
        if not isinstance(ann, dict):
            invalid_count += 1
            continue
        image_id = ann.get("image_id")
        category_id = ann.get("category_id")
        valid_ann = True
        if image_id not in image_map:
            invalid_count += 1
            valid_ann = False
            if len(unknown_image_examples) < 5:
                unknown_image_examples.append(str(image_id))
        if category_id not in cat_map:
            invalid_count += 1
            valid_ann = False
            if len(unknown_category_examples) < 5:
                unknown_category_examples.append(str(category_id))
        else:
            class_dist[cat_map[category_id]] += 1
        bbox = ann.get("bbox")
        if bbox is not None:
            ok = (isinstance(bbox, (list, tuple)) and len(bbox) == 4
                  and all(isinstance(v, (int, float)) for v in bbox))
            if ok:
                x, y, width, height = (float(v) for v in bbox)
                if width <= 0 or height <= 0 or x < 0 or y < 0:
                    ok = False
                dims = dimensions_by_id.get(image_id)
                if ok and dims is not None and (x + width > dims[0] + 1
                                                or y + height > dims[1] + 1):
                    ok = False
            if not ok:
                invalid_count += 1
                valid_ann = False
                if len(invalid_bbox_examples) < 5:
                    invalid_bbox_examples.append(str(ann.get("id", image_id)))
        if not valid_ann and image_id in image_map:
            image = image_map[image_id]
            parent = Path(str(image.get("file_name", ""))).parent.name
            source = str(image.get("source") or image.get("contributor")
                          or image.get("batch") or (parent if parent != "." else "unknown"))
            source_stats[source]["invalid"] += 1
    if unknown_image_examples:
        findings.append(_finding(
            "annotations-for-unknown-images",
            "Annotations reference unknown images", "high",
            "Some annotations point to image ids that do not exist.",
            {"examples": unknown_image_examples}, []))
    if unknown_category_examples:
        findings.append(_finding(
            "annotations-for-unknown-categories",
            "Annotations reference unknown categories", "high",
            "Some annotations point to category ids that do not exist.",
            {"examples": unknown_category_examples}, []))
    if invalid_bbox_examples:
        findings.append(_finding(
            "invalid-bounding-boxes", "Invalid bounding boxes", "high",
            "Some boxes are empty, negative, or outside the image.",
            {"examples": invalid_bbox_examples}, []))
    empty_images = sum(1 for image_id in image_map
                       if not anns_by_image.get(image_id))
    if empty_images > 0:
        findings.append(_finding(
            "images-without-annotations", "Images with no annotations",
            "low", "Some images have no annotations at all.",
            {"empty_images": empty_images}, []))
    ref_findings, ref_penalty, _unknown, _dev = _reference_checks(
        class_dist, len(annotations), reference)
    findings.extend(ref_findings)
    total_images = len(image_map)
    total_annotations = len(annotations)
    penalty = _penalty(
        duplicate_count / total_images if total_images else 0.0,
        missing_count / total_images if total_images else 0.0,
        invalid_count / total_annotations if total_annotations else 0.0,
        critical_same_content, ref_penalty)
    return _build_result(
        "COCO", total_images, total_annotations, duplicate_count,
        corrupt_count, missing_count, invalid_count, class_dist,
        _source_risk_table(source_stats), findings, limitations,
        files_found, penalty)


def _analyze_yolo(root: Path, reference: dict | None) -> dict:
    limitations = [
        "Label-noise detection here is annotation-based only: same content "
        "with different labels, unknown classes, and invalid boxes are "
        "flagged. Model-based label-noise detection is not implemented.",
        "Near-duplicate detection is exact-content (SHA-256) only; "
        "resized or re-encoded copies are not detected.",
    ]
    image_files: list[Path] = []
    for folder in (root / "images", root):
        if folder.is_dir():
            image_files.extend(sorted(
                p for p in folder.rglob("*")
                if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS))
    # De-duplicate: rglob from root already covers root/images when folder==root.
    seen_paths: set[str] = set()
    unique_images: list[Path] = []
    for path in image_files:
        key = str(path.resolve())
        if key not in seen_paths:
            seen_paths.add(key)
            unique_images.append(path)
    image_files = unique_images
    class_names: list[str] = []
    for candidate in (root / "classes.txt", root / "labels" / "classes.txt"):
        if candidate.is_file():
            class_names = [line.strip() for line in candidate.read_text(
                encoding="utf-8").splitlines() if line.strip()]
            break
    if not class_names and reference and reference.get("class_schema"):
        class_names = [str(item) for item in reference["class_schema"]]

    def label_path_for(image_path: Path) -> Path | None:
        candidates = [
            root / "labels" / (image_path.stem + ".txt"),
            image_path.with_suffix(".txt"),
        ]
        return next((p for p in candidates if p.is_file()), None)

    findings: list[dict] = []
    source_stats: dict[str, dict] = defaultdict(
        lambda: {"total": 0, "duplicates": 0, "missing": 0, "invalid": 0})
    hash_to_items: dict[str, list[dict]] = defaultdict(list)
    class_dist: Counter = Counter()
    total_annotations = 0
    invalid_count = 0
    missing_labels = 0
    empty_labels = 0
    missing_label_examples: list[str] = []
    invalid_examples: list[str] = []
    files_found = 0
    label_text_by_image: dict[str, str] = {}
    for image_path in image_files:
        try:
            relative = image_path.relative_to(root)
        except ValueError:
            relative = image_path
        source = relative.parent.name if len(relative.parts) > 1 else "unknown"
        source_stats[source]["total"] += 1
        files_found += 1
        if image_path.stat().st_size == 0:
            invalid_count += 1
        try:
            digest = _sha256_file(image_path)
        except OSError:
            invalid_count += 1
            continue
        label_path = label_path_for(image_path)
        label_text = ""
        if label_path is None:
            missing_labels += 1
            if len(missing_label_examples) < 5:
                missing_label_examples.append(image_path.name)
        else:
            label_text = label_path.read_text(encoding="utf-8", errors="replace")
            if not label_text.strip():
                empty_labels += 1
        label_text_by_image[str(image_path)] = "\n".join(
            sorted(line.strip() for line in label_text.splitlines() if line.strip()))
        hash_to_items[digest].append({"path": image_path, "label_text": label_text})
        if label_path is None:
            continue
        for line in label_text.splitlines():
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            total_annotations += 1
            valid_line = len(parts) >= 5
            class_id = None
            coords: list[float] = []
            if valid_line:
                try:
                    class_id = int(parts[0])
                    coords = [float(v) for v in parts[1:5]]
                except ValueError:
                    valid_line = False
            if valid_line and not all(0.0 <= v <= 1.0 for v in coords):
                valid_line = False
            if valid_line and class_id is not None and class_id < 0:
                valid_line = False
            if not valid_line:
                invalid_count += 1
                source_stats[source]["invalid"] += 1
                if len(invalid_examples) < 5:
                    invalid_examples.append(f"{image_path.name}: {line[:60]}")
                continue
            name = class_names[class_id] if class_id is not None and class_id < len(class_names) else f"class_{class_id}"
            class_dist[name] += 1
    orphan_labels = 0
    label_files = set()
    for folder in (root / "labels", root):
        if folder.is_dir():
            label_files.update(p for p in folder.glob("*.txt")
                               if p.name != "classes.txt")
    image_stems = {p.stem for p in image_files}
    for label_file in label_files:
        if label_file.stem not in image_stems:
            orphan_labels += 1
            invalid_count += 1
    duplicate_count = 0
    critical_same_content = False
    duplicate_examples: list[str] = []
    for digest, group in hash_to_items.items():
        if len(group) < 2:
            continue
        duplicate_count += len(group) - 1
        duplicate_examples.extend(item["path"].name for item in group)
        if len({item["label_text"] for item in group}) > 1:
            critical_same_content = True
    if duplicate_count > 0:
        findings.append(_finding(
            "duplicate-content", "Duplicate image content", "high",
            "Multiple dataset entries have identical file content "
            "(SHA-256).", {"duplicate_extra_copies": duplicate_count},
            duplicate_examples[:5]))
    if critical_same_content:
        findings.append(_finding(
            "same-content-different-labels",
            "Same image content with different labels", "critical",
            "Identical image files carry different YOLO labels. "
            "This is a strong label-flipping / poisoning signal.",
            {}, []))
    if missing_labels > 0:
        findings.append(_finding(
            "images-without-labels", "Images with no label file", "high",
            "Some images have no corresponding YOLO label file.",
            {"missing_label_files": missing_labels}, missing_label_examples))
    if empty_labels > 0:
        findings.append(_finding(
            "empty-label-files", "Empty label files", "low",
            "Some label files contain no boxes.",
            {"empty_label_files": empty_labels}, []))
    if orphan_labels > 0:
        findings.append(_finding(
            "labels-without-images", "Label files with no image", "high",
            "Some label files have no corresponding image.",
            {"orphan_label_files": orphan_labels}, []))
    if invalid_examples:
        findings.append(_finding(
            "invalid-yolo-lines", "Invalid YOLO label lines", "high",
            "Some label lines are not class + 4 coordinates in [0, 1].",
            {"examples": invalid_examples}, []))
    ref_findings, ref_penalty, _unknown, _dev = _reference_checks(
        class_dist, total_annotations, reference)
    findings.extend(ref_findings)
    total_images = len(image_files)
    penalty = _penalty(
        duplicate_count / total_images if total_images else 0.0,
        missing_labels / total_images if total_images else 0.0,
        invalid_count / total_annotations if total_annotations else 0.0,
        critical_same_content, ref_penalty)
    return _build_result(
        "YOLO", total_images, total_annotations, duplicate_count,
        0, missing_labels, invalid_count, class_dist,
        _source_risk_table(source_stats), findings, limitations,
        files_found, penalty)


def analyze_dataset(dataset_path: str, format_hint: str | None = None,
                    reference: dict | None = None) -> dict:
    """Analyse a dataset directory or a single COCO JSON file."""
    root = Path(dataset_path)
    if not root.exists():
        raise FileNotFoundError(f"Dataset path does not exist: {dataset_path}")
    hint = (format_hint or "auto").strip().upper()
    if hint not in ("AUTO", "COCO", "YOLO"):
        raise ValueError(f"Unsupported format hint: {format_hint}")
    fmt = hint if hint != "AUTO" else _detect_format(root)
    if fmt == "COCO":
        return _analyze_coco(root, reference)
    return _analyze_yolo(root, reference)
