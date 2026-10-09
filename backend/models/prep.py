"""
models/prep.py — PrepQuestion model
"""
from core.extensions import db
from models.base import BaseModel


class PrepQuestion(BaseModel):
    __tablename__ = 'prep_questions'

    id = db.Column(db.Integer, primary_key=True)
    track = db.Column(db.String(50), nullable=False, index=True)   # 'ai-engineer' | 'system-design'
    topic = db.Column(db.String(100), nullable=False, index=True)
    topic_label = db.Column(db.String(100))
    difficulty = db.Column(db.String(20), default='Medium', index=True)  # 'Easy' | 'Medium' | 'Hard'
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    key_takeaways = db.Column(db.Text)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'track': self.track,
            'topic': self.topic,
            'topic_label': self.topic_label or self.topic.replace('-', ' ').title(),
            'difficulty': self.difficulty,
            'question': self.question,
            'answer': self.answer,
            'key_takeaways': self.key_takeaways,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
