"""Local disk filesystem storage backend."""

import aiofiles
from pathlib import Path
from app.storage.base import StorageBackend


class LocalStorage(StorageBackend):
    def __init__(self, base_dir: Path | str = "data"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save(self, file_path: str, data: bytes) -> str:
        dest = self.base_dir / file_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(dest, "wb") as f:
            await f.write(data)
        return str(dest)

    async def load(self, file_path: str) -> bytes:
        dest = self.base_dir / file_path
        async with aiofiles.open(dest, "rb") as f:
            return await f.read()

    async def delete(self, file_path: str) -> bool:
        dest = self.base_dir / file_path
        if dest.exists():
            dest.unlink()
            return True
        return False

    async def exists(self, file_path: str) -> bool:
        return (self.base_dir / file_path).exists()
