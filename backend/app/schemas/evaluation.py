"""Evaluation scenario and benchmark run schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class EvaluationScenario(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    scenario_id: str
    name: str
    domain: str
    description: str
    baseline_threshold: float
