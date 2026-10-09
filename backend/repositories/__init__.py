"""
repositories package — OOP Data Access Layer
"""
from repositories.job_repository import JobRepository, job_repo
from repositories.hr_repository import HRRepository, hr_repo
from repositories.user_repository import UserRepository, user_repo
from repositories.research_repository import ResearchRepository, research_repo
from repositories.prep_repository import PrepRepository, prep_repo

__all__ = [
    "JobRepository",
    "job_repo",
    "HRRepository",
    "hr_repo",
    "UserRepository",
    "user_repo",
    "ResearchRepository",
    "research_repo",
    "PrepRepository",
    "prep_repo",
]
