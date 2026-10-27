# Test datasets for the data-integrity service

These are small synthetic datasets for testing only. The image files
are placeholder text files with a .png name, not real photos. That is
intentional: the service checks content hashes, labels, boxes and
missing files, and those checks work on any non-empty file. Replace
any placeholder with a real photo of the same name if you want a
visual demo.

## poisoned-coco

Expected result: status quarantine, score below 0.75.

- a.png and b.png have identical content, but a.png is labelled car
  and b.png is labelled truck: same-content-different-labels (critical).
- c.png has a negative-width bounding box: invalid box.
- annotations reference image id 99, which does not exist.
- images/missing.png is annotated but has no file on disk.

## clean-coco

Expected result: status pass, score 1.0, no duplicates, no invalid
annotations.

## Test with the service running on port 8101

```bash
curl -X POST http://127.0.0.1:8101/analyze \
  -H "Content-Type: application/json" \
  -d '{"dataset_path": "/Users/pranitkolhe/Desktop/ai-assurance-platform/data/test-datasets/poisoned-coco", "format": "COCO"}'
```

Replace poisoned-coco with clean-coco for the clean case.
