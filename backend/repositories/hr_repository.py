"""
repositories/hr_repository.py
------------------------------
All database access for HRContact records.
"""
from typing import Optional
from sqlalchemy import or_
from models.hr import HRContact
from core.extensions import db


class HRRepository:
    def get_by_id(self, hr_id: int) -> Optional[HRContact]:
        return HRContact.query.get(hr_id)

    def get_by_dedupe_key(self, key: str) -> Optional[HRContact]:
        return HRContact.query.filter_by(dedupe_key=key).first()

    def get_total_count(self) -> int:
        return HRContact.query.count()

    def search(
        self,
        q: str = '',
        company: str = '',
        niche: str = '',
        page: int = 1,
        limit: int = 24,
    ) -> tuple[list[HRContact], int]:
        query = HRContact.query

        if q:
            query = query.filter(or_(
                HRContact.name.ilike(f'%{q}%'),
                HRContact.company.ilike(f'%{q}%'),
                HRContact.title.ilike(f'%{q}%'),
                HRContact.company_niche.ilike(f'%{q}%'),
            ))
        if company:
            query = query.filter(HRContact.company.ilike(f'%{company}%'))
        if niche:
            query = query.filter(HRContact.company_niche.ilike(f'%{niche}%'))

        total = query.count()
        contacts = query.order_by(HRContact.id.desc()).offset((page - 1) * limit).limit(limit).all()
        return contacts, total

    def upsert(self, data: dict) -> tuple[HRContact, bool]:
        existing = self.get_by_dedupe_key(data['dedupe_key'])
        if existing:
            return existing, False
        hr = HRContact(**{k: v for k, v in data.items() if hasattr(HRContact, k)})
        db.session.add(hr)
        return hr, True

    def get_for_matching(self, limit: int = 50) -> list[HRContact]:
        return HRContact.query.limit(limit).all()


hr_repo = HRRepository()
