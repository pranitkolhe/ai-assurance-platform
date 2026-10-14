"""Inference record schemas matching frontend inference.model.ts."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, AliasChoices


class InferenceRecordBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True, protected_namespaces=())

    image_id: str = Field(
        ...,
        validation_alias=AliasChoices("imageId", "image_id"),
        serialization_alias="imageId",
    )
    image_hash: str = Field(
        ...,
        validation_alias=AliasChoices("imageHash", "image_hash"),
        serialization_alias="imageHash",
    )
    model_id: str = Field(
        ...,
        validation_alias=AliasChoices("modelId", "model_id"),
        serialization_alias="modelId",
    )
    model_hash: str = Field(
        ...,
        validation_alias=AliasChoices("modelHash", "model_hash"),
        serialization_alias="modelHash",
    )
    preprocessing_hash: str = Field(
        ...,
        validation_alias=AliasChoices("preprocessingHash", "preprocessing_hash"),
        serialization_alias="preprocessingHash",
    )
    timestamp: datetime
    sequence: int
    nonce: str
    signature_valid: bool = Field(
        True,
        validation_alias=AliasChoices("signatureValid", "signature_valid"),
        serialization_alias="signatureValid",
    )
    replay_detected: bool = Field(
        False,
        validation_alias=AliasChoices("replayDetected", "replay_detected"),
        serialization_alias="replayDetected",
    )
    output_tampered: bool = Field(
        False,
        validation_alias=AliasChoices("outputTampered", "output_tampered"),
        serialization_alias="outputTampered",
    )


class InferenceRecordCreate(InferenceRecordBase):
    assessment_id: str = Field(
        ...,
        validation_alias=AliasChoices("assessmentId", "assessment_id"),
        serialization_alias="assessmentId",
    )


class InferenceRecordResponse(InferenceRecordBase):
    id: str
    assessment_id: str = Field(
        ...,
        validation_alias=AliasChoices("assessmentId", "assessment_id"),
        serialization_alias="assessmentId",
    )

