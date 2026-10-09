"""
core/exceptions.py
------------------
Custom exception hierarchy for JobOrbit.
All application errors inherit from AppError so one global
errorhandler can format consistent JSON responses.
"""


class AppError(Exception):
    """Base application exception — maps to HTTP 500 by default."""
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, message: str = "An unexpected error occurred", status_code: int = None, error_code: str = None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        if error_code is not None:
            self.error_code = error_code

    def to_dict(self) -> dict:
        return {
            "status": "error",
            "error_code": self.error_code,
            "message": self.message,
        }


# ── 400 Bad Request ───────────────────────────────────────────────────────────
class ValidationError(AppError):
    status_code = 400
    error_code = "VALIDATION_ERROR"


class MissingFieldError(ValidationError):
    error_code = "MISSING_FIELD"

    def __init__(self, field: str):
        super().__init__(f"Required field '{field}' is missing or empty.")


class InvalidValueError(ValidationError):
    error_code = "INVALID_VALUE"


# ── 401 Unauthorized ──────────────────────────────────────────────────────────
class AuthError(AppError):
    status_code = 401
    error_code = "UNAUTHORIZED"


class InvalidTokenError(AuthError):
    error_code = "INVALID_TOKEN"


# ── 403 Forbidden ─────────────────────────────────────────────────────────────
class ForbiddenError(AppError):
    status_code = 403
    error_code = "FORBIDDEN"


class PremiumRequiredError(ForbiddenError):
    error_code = "PREMIUM_REQUIRED"

    def __init__(self):
        super().__init__("This feature requires VIP access. Upgrade from ₹99.")


# ── 404 Not Found ─────────────────────────────────────────────────────────────
class NotFoundError(AppError):
    status_code = 404
    error_code = "NOT_FOUND"

    def __init__(self, resource: str = "Resource"):
        super().__init__(f"{resource} was not found.")


# ── 409 Conflict ──────────────────────────────────────────────────────────────
class ConflictError(AppError):
    status_code = 409
    error_code = "CONFLICT"


class SyncAlreadyRunningError(ConflictError):
    error_code = "SYNC_ALREADY_RUNNING"

    def __init__(self):
        super().__init__("A sync pipeline is already running. Wait for it to finish.")


class DuplicateError(ConflictError):
    error_code = "DUPLICATE_RESOURCE"


# ── 422 Unprocessable Entity ──────────────────────────────────────────────────
class UnprocessableError(AppError):
    status_code = 422
    error_code = "UNPROCESSABLE"


# ── 429 Too Many Requests ─────────────────────────────────────────────────────
class RateLimitedError(AppError):
    status_code = 429
    error_code = "RATE_LIMITED"

    def __init__(self):
        super().__init__("Too many requests. Please slow down.")


# ── 500 Internal Server Errors ────────────────────────────────────────────────
class ScraperError(AppError):
    status_code = 502
    error_code = "SCRAPER_ERROR"


class DatabaseError(AppError):
    status_code = 500
    error_code = "DATABASE_ERROR"


class PaymentError(AppError):
    status_code = 500
    error_code = "PAYMENT_ERROR"
