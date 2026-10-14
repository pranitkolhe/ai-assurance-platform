"""File format and size validation matching frontend fileValidation.ts."""

import math
from pathlib import Path

MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024  # 20 GB

FORMAT_EXTENSIONS = {
    "COCO": [".json", ".zip"],
    "YOLO": [".zip"],
    "ONNX": [".onnx"],
    "PyTorch": [".pt", ".pth"],
    "TorchScript": [".pt", ".torchscript"],
    "JSON": [".json"],
    "JSONL": [".jsonl"],
    "CSV": [".csv"],
}


def validate_file_format(filename: str, format_name: str) -> bool:
    allowed = FORMAT_EXTENSIONS.get(format_name.upper(), [])
    ext = Path(filename).suffix.lower()
    return ext in allowed


def format_file_size(bytes_count: int | float) -> str:
    if bytes_count <= 0:
        return "0 Bytes"
    units = ["Bytes", "KB", "MB", "GB", "TB"]
    index = int(math.floor(math.log(bytes_count) / math.log(1024)))
    index = min(index, len(units) - 1)
    return f"{bytes_count / (1024 ** index):.1f} {units[index]}"
