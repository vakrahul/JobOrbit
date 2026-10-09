"""
models.py — Backward Compatibility Shim
-----------------------------------------
The models package was refactored into models/ directory.
This file exists so any legacy imports still work.
All imports re-export from models/__init__.py
"""
from models import (
    db,
    Job,
    User,
    SavedJob,
    HRContact,
    ProfessorContact,
    PrepQuestion,
    ScrapeLog,
    generate_job_dedupe_key,
    generate_hr_dedupe_key,
    TimestampMixin,
    SoftDeleteMixin,
    BaseModel,
)

__all__ = [
    'db', 'Job', 'User', 'SavedJob', 'HRContact',
    'ProfessorContact', 'PrepQuestion', 'ScrapeLog',
    'generate_job_dedupe_key', 'generate_hr_dedupe_key',
    'TimestampMixin', 'SoftDeleteMixin', 'BaseModel',
]
