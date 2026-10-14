"""Submission intake and pipeline triggering service."""

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories.assessment_repository import AssessmentRepository
from app.db.models.assessment import Assessment


class SubmissionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = AssessmentRepository(session)

    async def submit_assessment(self, name: str, contributor_id: str, use_case: str, task: str) -> Assessment:
        assessment = Assessment(
            name=name,
            contributor_id=contributor_id,
            use_case=use_case,
            task=task,
            status="submitted",
        )
        return await self.repo.create(assessment)
