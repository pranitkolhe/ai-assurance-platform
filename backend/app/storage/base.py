"""Abstract storage backend interface."""

from abc import ABC, abstractmethod
from pathlib import Path


class StorageBackend(ABC):
    @abstractmethod
    async def save(self, file_path: str, data: bytes) -> str:
        """Persist data and return file path."""
        pass

    @abstractmethod
    async def load(self, file_path: str) -> bytes:
        """Load data from file path."""
        pass

    @abstractmethod
    async def delete(self, file_path: str) -> bool:
        """Remove file."""
        pass

    @abstractmethod
    async def exists(self, file_path: str) -> bool:
        """Check if file exists."""
        pass
