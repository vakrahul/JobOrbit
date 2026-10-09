"""
repositories/research_repository.py
-----------------------------------
OOP Data access layer for ProfessorContact (IIT/IISc Research Labs directory).
"""
from typing import Optional, List, Tuple
from sqlalchemy import or_, func
from models.research import ProfessorContact
from core.extensions import db


class ResearchRepository:
    def get_by_id(self, prof_id: int) -> Optional[ProfessorContact]:
        return ProfessorContact.query.get(prof_id)

    def get_by_dedupe_key(self, key: str) -> Optional[ProfessorContact]:
        return ProfessorContact.query.filter_by(dedupe_key=key).first()

    def get_total_count(self) -> int:
        return ProfessorContact.query.count()

    def search(
        self,
        q: str = '',
        institute: str = '',
        department: str = '',
        page: int = 1,
        limit: int = 24
    ) -> Tuple[List[ProfessorContact], int]:
        query = ProfessorContact.query

        if q:
            search_pattern = f"%{q}%"
            query = query.filter(or_(
                ProfessorContact.name.ilike(search_pattern),
                ProfessorContact.institute.ilike(search_pattern),
                ProfessorContact.department.ilike(search_pattern),
                ProfessorContact.research_areas.ilike(search_pattern)
            ))

        if institute and institute.lower() != 'all':
            query = query.filter(ProfessorContact.institute.ilike(f"%{institute}%"))

        if department and department.lower() != 'all':
            query = query.filter(ProfessorContact.department.ilike(f"%{department}%"))

        total = query.count()
        professors = (
            query.order_by(ProfessorContact.id.asc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return professors, total

    def get_top_institutes(self, limit: int = 15) -> List[dict]:
        results = (
            db.session.query(ProfessorContact.institute, func.count(ProfessorContact.id))
            .filter(ProfessorContact.institute.isnot(None))
            .group_by(ProfessorContact.institute)
            .order_by(func.count(ProfessorContact.id).desc())
            .limit(limit)
            .all()
        )
        return [{'name': r[0], 'count': r[1]} for r in results if r[0]]

    def get_all_institutes(self) -> List[dict]:
        results = (
            db.session.query(ProfessorContact.institute, func.count(ProfessorContact.id))
            .filter(ProfessorContact.institute.isnot(None))
            .group_by(ProfessorContact.institute)
            .order_by(func.count(ProfessorContact.id).desc())
            .all()
        )
        return [{'name': r[0], 'count': r[1]} for r in results if r[0]]

    def upsert(self, data: dict) -> Tuple[ProfessorContact, bool]:
        d_key = data.get('dedupe_key')
        existing = self.get_by_dedupe_key(d_key) if d_key else None
        if existing:
            for k, v in data.items():
                if hasattr(existing, k) and v is not None:
                    setattr(existing, k, v)
            db.session.commit()
            return existing, False

        prof = ProfessorContact(**{k: v for k, v in data.items() if hasattr(ProfessorContact, k)})
        db.session.add(prof)
        db.session.commit()
        return prof, True

    def get_for_matching(self, limit: int = 50) -> List[ProfessorContact]:
        return ProfessorContact.query.limit(limit).all()


research_repo = ResearchRepository()
