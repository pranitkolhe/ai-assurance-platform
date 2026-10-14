"""Role-based access control policies."""

from app.core.enums import UserRole
from app.core.exceptions import ForbiddenException

ROLE_PERMISSIONS: dict[UserRole, set[str]] = {
    UserRole.ADMIN: {"read:all", "write:all", "delete:all", "manage:users", "manage:system"},
    UserRole.ANALYST: {"read:all", "write:findings", "write:assurance", "write:decisions", "export:reports"},
    UserRole.CONTRIBUTOR: {"read:own", "write:submissions", "read:public_references"},
}


def check_permission(user_role: str, permission: str) -> bool:
    role = UserRole(user_role)
    perms = ROLE_PERMISSIONS.get(role, set())
    return "write:all" in perms or permission in perms


def require_permission(user_role: str, permission: str) -> None:
    if not check_permission(user_role, permission):
        raise ForbiddenException(f"Role '{user_role}' lacks permission '{permission}'")
