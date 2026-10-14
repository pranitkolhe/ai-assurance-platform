"""Domain enumerations for the CV Assurance platform matching frontend models."""

from enum import Enum


class AssetType(str, Enum):
    DATASET = "dataset"
    MODEL = "model"
    INFERENCE = "inference"


class AssetStatus(str, Enum):
    SUBMITTED = "submitted"
    VERIFIED = "verified"
    FLAGGED = "flagged"


class AssessmentStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    REGISTERED = "registered"
    ANALYSIS = "analysis"
    REVIEW = "review"
    COMPLETED = "completed"


class AssessmentRisk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FindingStatus(str, Enum):
    OPEN = "open"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"


class ReportRecommendation(str, Enum):
    ACCEPT = "accept"
    REVIEW = "review"
    QUARANTINE = "quarantine"


class ReferenceType(str, Enum):
    DATASET = "dataset"
    MODEL = "model"
    INFERENCE = "inference"


class ReferenceStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    ARCHIVED = "archived"


class ProcessingStatus(str, Enum):
    SUBMITTED = "submitted"
    REGISTERING = "registering"
    QUEUED = "queued"
    REFERENCE_ASSIGNMENT = "reference_assignment"
    PROCESSING = "processing"
    ANALYSIS_COMPLETE = "analysis_complete"
    COMPLETED = "completed"
    FAILED = "failed"


class UserRole(str, Enum):
    ADMIN = "admin"
    CONTRIBUTOR = "contributor"
    ANALYST = "analyst"


class AssuranceDomain(str, Enum):
    DATA_INTEGRITY = "data_integrity"
    MODEL_INTEGRITY = "model_integrity"
    INFERENCE_VERIFICATION = "inference_verification"
    DISTRIBUTION_ANALYSIS = "distribution_analysis"


class MetricStatus(str, Enum):
    PASS = "pass"
    WARNING = "warning"
    FAIL = "fail"


class DatasetFormat(str, Enum):
    COCO = "COCO"
    YOLO = "YOLO"


class ModelFormat(str, Enum):
    ONNX = "ONNX"
    PYTORCH = "PyTorch"
    TORCHSCRIPT = "TorchScript"


class InferenceFormat(str, Enum):
    JSON = "JSON"
    JSONL = "JSONL"
    CSV = "CSV"
