"""Distribution-shift analysis -- REAL class-distribution comparison.

What is implemented today (real, tested, pure stdlib):
  - Reads a COCO dataset (annotations.json) or a YOLO dataset
    (classes.txt + labels/*.txt) and counts class frequencies.
  - Compares those proportions to a reference class_distribution
    supplied in `reference` (for example a clean reference profile).
  - Reports max_deviation (largest per-class proportion difference),
    mean_deviation, and a per-class drifted list.
  - Scoring: score = 1 - max_deviation, clamped to [0, 1].
    Status: pass if max_deviation <= 0.20, review if <= 0.40,
    quarantine if > 0.40 or if a reference class is entirely absent
    while the dataset is non-empty (that is a systematic change,
    not sampling noise, at the scale this service is used at).
  - If no reference is supplied, the service returns status
    "review" with the measured distribution and a limitation -- it
    cannot call something "shifted" with nothing to compare against,
    and it will not invent a reference.

What is NOT implemented yet (the assignee's work, see README.md):
  - Embedding / feature distribution comparison (KS test,
    Wasserstein distance on real embeddings) -- needs a feature
    extractor and a real reference profile, not just class counts.
  - Terrain / season / sensor / illumination metadata breakdowns.
  - Drift-vs-manipulation rules (for example, a single class
    spiking vs a broad shift) beyond the class-level signal here.
  - Statistical significance: no p-value is reported, because with
    class counts alone a p-value would overstate certainty.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path


def _coco_distribution(root: Path) -> tuple[Counter, int]:
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
        raise ValueError("No COCO annotation JSON file was found.")
    data = json.loads(annotation_path.read_text(encoding="utf-8"))
    cat_map = {}
    for category in data.get("categories", []):
        if isinstance(category, dict) and "id" in category:
            cat_map[category["id"]] = str(category.get("name", category["id"]))
    counts: Counter = Counter()
    for ann in data.get("annotations", []):
        if isinstance(ann, dict) and ann.get("category_id") in cat_map:
            counts[cat_map[ann["category_id"]]] += 1
    return counts, sum(counts.values())


def _yolo_distribution(root: Path) -> tuple[Counter, int]:
    class_names: list[str] = []
    for candidate in (root / "classes.txt", root / "labels" / "classes.txt"):
        if candidate.is_file():
            class_names = [line.strip() for line in candidate.read_text(
                encoding="utf-8").splitlines() if line.strip()]
            break
    counts: Counter = Counter()
    label_files = []
    for folder in (root / "labels", root):
        if folder.is_dir():
            label_files.extend(p for p in folder.glob("*.txt") if p.name != "classes.txt")
    for label_file in label_files:
        for line in label_file.read_text(encoding="utf-8", errors="replace").splitlines():
            parts = line.split()
            if not parts:
                continue
            try:
                class_id = int(parts[0])
            except ValueError:
                continue
            name = class_names[class_id] if 0 <= class_id < len(class_names) else f"class_{class_id}"
            counts[name] += 1
    return counts, sum(counts.values())


def analyze_distribution_shift(dataset_path: str, reference: dict | None = None) -> dict:
    root = Path(dataset_path)
    if not root.exists():
        raise FileNotFoundError(f"Dataset path does not exist: {dataset_path}")
    if root.is_dir() and (root / "labels").is_dir():
        counts, total = _yolo_distribution(root)
    elif root.is_dir():
        try:
            counts, total = _coco_distribution(root)
        except ValueError:
            counts, total = _yolo_distribution(root)
    else:
        raise ValueError("Dataset path must be a directory containing a COCO or YOLO dataset")
    if total == 0:
        raise ValueError("Dataset contains no annotations to compare")
    actual = {name: count / total for name, count in counts.items()}
    limitations = [
        "Shift is measured on class proportions only. Embedding / "
        "feature distribution shift (KS / Wasserstein on real "
        "features) is not implemented -- see README.md.",
        "No p-value is reported: class counts alone do not justify "
        "a significance claim.",
    ]
    ref_dist = None
    if reference:
        ref_dist = reference.get("class_distribution") or reference.get("distribution")
    if not ref_dist:
        return {
            "domain": "distribution_shift",
            "status": "review",
            "score": 0.5,
            "confidence": 0.5,
            "max_deviation": 0.0,
            "mean_deviation": 0.0,
            "class_distribution": actual,
            "reference_distribution": {},
            "covariate_shift_detected": False,
            "concept_drift_detected": False,
            "findings": [{
                "id": "no-reference",
                "title": "No reference distribution supplied",
                "severity": "medium",
                "reason": "Shift cannot be judged without a declared reference distribution.",
                "evidence": {},
                "affected_assets": [],
            }],
            "limitations": limitations + [
                "No reference distribution was supplied, so no deviation was computed.",
            ],
            "unsupported": ["Embedding-based shift", "Sensor / terrain / season breakdown"],
        }
    total_ref = float(sum(float(v) for v in ref_dist.values()))
    if total_ref <= 0:
        raise ValueError("Reference class_distribution must sum to more than zero")
    expected = {str(k): float(v) / total_ref for k, v in ref_dist.items()}
    names = sorted(set(actual) | set(expected))
    deviations = {name: abs(actual.get(name, 0.0) - expected.get(name, 0.0)) for name in names}
    max_dev = max(deviations.values()) if deviations else 0.0
    mean_dev = sum(deviations.values()) / len(deviations) if deviations else 0.0
    drifted = [name for name, dev in deviations.items() if dev > 0.20]
    findings: list[dict] = []
    if drifted:
        findings.append({
            "id": "class-distribution-shift",
            "title": "Class distribution shifted vs reference",
            "severity": "high" if max_dev > 0.40 else "medium",
            "reason": "One or more classes differ from the reference proportion by more than 0.20.",
            "evidence": {"drifted_classes": drifted, "max_deviation": round(max_dev, 4)},
            "affected_assets": [],
        })
    missing_ref = [name for name in expected if actual.get(name, 0.0) == 0.0]
    if missing_ref:
        findings.append({
            "id": "reference-classes-absent",
            "title": "Reference classes with no samples",
            "severity": "high",
            "reason": "Reference classes are entirely absent from this dataset.",
            "evidence": {"missing_classes": missing_ref},
            "affected_assets": [],
        })
    score = max(0.0, min(1.0, 1.0 - max_dev))
    if max_dev > 0.40 or missing_ref:
        status = "quarantine"
    elif max_dev > 0.20:
        status = "review"
    else:
        status = "pass"
    return {
        "domain": "distribution_shift",
        "status": status,
        "score": round(score, 4),
        "confidence": 1.0,
        "max_deviation": round(max_dev, 4),
        "mean_deviation": round(mean_dev, 4),
        "class_distribution": actual,
        "reference_distribution": expected,
        "covariate_shift_detected": max_dev > 0.20,
        "concept_drift_detected": False,
        "findings": findings,
        "limitations": limitations,
        "unsupported": ["Embedding-based shift", "Sensor / terrain / season breakdown"],
    }
