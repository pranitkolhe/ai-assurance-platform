"""Reference standard schemas matching frontend reference.model.ts."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field, AliasChoices
from app.core.enums import ReferenceStatus, ReferenceType


class ReferenceCompatibility(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    framework: str | None = None
    architecture: str | None = None
    input_dimensions: str | None = Field(
        None,
        validation_alias=AliasChoices("inputDimensions", "input_dimensions"),
        serialization_alias="inputDimensions",
    )
    class_schema: str | None = Field(
        None,
        validation_alias=AliasChoices("classSchema", "class_schema"),
        serialization_alias="classSchema",
    )
    sensor: str | None = None
    environment: str | None = None
    season: str | None = None
    terrain: str | None = None
    illumination: str | None = None


class ReferenceBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    name: str
    type: ReferenceType
    status: ReferenceStatus = ReferenceStatus.ACTIVE
    task: str = "Object Detection"
    format: str = "COCO"
    description: str = ""
    source: str = "Standard Registry"
    registered_by: str = Field(
        "System",
        validation_alias=AliasChoices("registeredBy", "registered_by"),
        serialization_alias="registeredBy",
    )
    compatibility: ReferenceCompatibility = ReferenceCompatibility()
    metadata: dict[str, Any] = {}


class ReferenceCreate(ReferenceBase):
    pass


class ReferenceUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    status: ReferenceStatus | None = None
    description: str | None = None
    compatibility: ReferenceCompatibility | None = None
    metadata: dict[str, Any] | None = None


class ReferenceResponse(ReferenceBase):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    id: str
    registered_at: datetime = Field(
        ...,
        validation_alias=AliasChoices("registeredAt", "registered_at"),
        serialization_alias="registeredAt",
    )

