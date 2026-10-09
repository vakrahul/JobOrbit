"""
repositories/prep_repository.py
-------------------------------
OOP Data access layer for PrepQuestion (Technical Interview Vault).
"""
from typing import Optional, List, Tuple
from sqlalchemy import or_, func
from models.prep import PrepQuestion
from core.extensions import db


class PrepRepository:
    def get_by_id(self, question_id: int) -> Optional[PrepQuestion]:
        return PrepQuestion.query.get(question_id)

    def get_by_question_text(self, track: str, question: str) -> Optional[PrepQuestion]:
        return PrepQuestion.query.filter_by(track=track, question=question).first()

    def get_total_count(self) -> int:
        return PrepQuestion.query.count()

    def get_tracks_summary(self) -> Tuple[List[dict], int]:
        topics = (
            db.session.query(
                PrepQuestion.track,
                PrepQuestion.topic,
                PrepQuestion.topic_label,
                func.count(PrepQuestion.id)
            )
            .group_by(PrepQuestion.track, PrepQuestion.topic, PrepQuestion.topic_label)
            .all()
        )

        tracks_data = {}
        for track, topic, label, count in topics:
            if track not in tracks_data:
                tracks_data[track] = {
                    'track': track,
                    'name': 'AI Engineer' if track == 'ai-engineer' else 'System Design',
                    'description': (
                        'Modern AI, LLMs, Agents, RAG & Evaluation'
                        if track == 'ai-engineer'
                        else 'High-scale distributed systems, databases & architecture'
                    ),
                    'total_questions': 0,
                    'topics': []
                }
            tracks_data[track]['total_questions'] += count
            tracks_data[track]['topics'].append({
                'topic': topic,
                'label': label or topic.replace('-', ' ').title(),
                'count': count
            })

        total = sum(t['total_questions'] for t in tracks_data.values())
        return list(tracks_data.values()), total

    def search(
        self,
        track: str = '',
        topic: str = '',
        difficulty: str = '',
        q: str = '',
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[PrepQuestion], int]:
        query = PrepQuestion.query

        if track and track.lower() != 'all':
            query = query.filter(PrepQuestion.track == track)

        if topic and topic.lower() != 'all':
            query = query.filter(PrepQuestion.topic == topic)

        if difficulty and difficulty.lower() != 'all':
            query = query.filter(PrepQuestion.difficulty.ilike(f"%{difficulty}%"))

        if q:
            search_pattern = f"%{q}%"
            query = query.filter(or_(
                PrepQuestion.question.ilike(search_pattern),
                PrepQuestion.answer.ilike(search_pattern),
                PrepQuestion.topic_label.ilike(search_pattern)
            ))

        total = query.count()
        questions = (
            query.order_by(PrepQuestion.id.asc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return questions, total

    def upsert(self, data: dict) -> Tuple[PrepQuestion, bool]:
        track = data.get('track')
        question = data.get('question')
        existing = self.get_by_question_text(track, question) if track and question else None

        if existing:
            for k, v in data.items():
                if hasattr(existing, k) and v is not None:
                    setattr(existing, k, v)
            db.session.commit()
            return existing, False

        item = PrepQuestion(**{k: v for k, v in data.items() if hasattr(PrepQuestion, k)})
        db.session.add(item)
        db.session.commit()
        return item, True


prep_repo = PrepRepository()
