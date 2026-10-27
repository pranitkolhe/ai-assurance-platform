# Data Integrity Service

Standalone service for SIH 2026 capability 2.2.1 (training-data integrity).
It is the first real engine in ai-assurance-platform: everything else in
the prototype that returned hard-coded scores is untouched by this service.

## Run

```bash
cd services/data-integrity
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8101
```

Health check: `GET http://127.0.0.1:8101/health`

## API

`POST /analyze` with JSON:

```json
{
  "dataset_path": "/path/to/dataset",
  "format": "COCO",
  "reference": {
    "class_schema": ["car", "truck"],
    "class_distribution": {"car": 0.7, "truck": 0.3}
  }
}
```

`format` may be `COCO`, `YOLO`, or omitted for auto-detect. `dataset_path`
may be a COCO JSON file, or a directory containing COCO annotations or
YOLO images + labels. `reference` is optional.

The response contains: domain, format, status (`pass`, `review`,
`quarantine`), score (0-1, computed, never hard-coded), confidence
(proportion of annotated images whose files were found), total images,
total annotations, duplicate count, corrupt count, missing-file count,
invalid-annotation count, class distribution, per-source risk, findings
(each with severity, reason, evidence, and affected assets), and
limitations.

## What it actually checks

- COCO: duplicate category/image ids, missing image files, empty or
  unreadable files, exact-content duplicates (SHA-256), the same content
  with different labels (critical), annotations pointing to unknown
  images/categories, invalid bounding boxes (empty, negative, or outside
  the image when dimensions are known), images with no annotations.
- YOLO: images with no label file, label files with no image, empty
  label files, invalid label lines (class + 4 coordinates in [0, 1]),
  exact-content duplicates, same content with different labels.
- Both: class distribution, categories outside an optional reference
  schema, missing reference categories, distribution deviation over 0.20,
  and per-source rates (source = COCO `source`/`contributor`/`batch`
  field, or the image subfolder for YOLO).

## Honest limitations

- Near-duplicate detection is exact-content only; resized or re-encoded
  copies are not detected.
- Label-noise detection is annotation-based only; model-based label
  noise needs Phase 2.
- A trigger that is invisible in the annotations is not detected here;
  that is the backdoor service's job.
- If image files are not present, only annotation checks run and
  confidence drops accordingly; the service never reports a pass it
  did not compute.

## Tests

```bash
python -m unittest test_analyzer.py -v
```

The tests build small temporary COCO datasets in memory, so they need
no real dataset and no network.
