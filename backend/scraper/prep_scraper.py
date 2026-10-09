import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import requests
from bs4 import BeautifulSoup
import re
import json
import time
import logging
from scraper.config import REQUEST_HEADERS
from models import db, PrepQuestion
from core.config import settings

logger = logging.getLogger(__name__)

PREP_TOPICS = [
    {
        'track': 'system-design',
        'topic': 'system-design',
        'label': 'System Design Fundamentals & Architectures',
        'url': 'https://joborbit-upstream.app/prep/system-design'
    },
    {
        'track': 'ai-engineer',
        'topic': 'agentic-ai',
        'label': 'Agentic AI & Autonomous Systems',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/agentic-ai'
    },
    {
        'track': 'ai-engineer',
        'topic': 'ai-agents',
        'label': 'AI Agents & Multi-Agent Orchestration',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/ai-agents'
    },
    {
        'track': 'ai-engineer',
        'topic': 'rag',
        'label': 'Retrieval-Augmented Generation (RAG)',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/rag'
    },
    {
        'track': 'ai-engineer',
        'topic': 'vector-databases-embeddings',
        'label': 'Vector Databases & Embeddings',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/vector-databases-embeddings'
    },
    {
        'track': 'ai-engineer',
        'topic': 'llm-fundamentals',
        'label': 'LLM Fundamentals & Transformer Architecture',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/llm-fundamentals'
    },
    {
        'track': 'ai-engineer',
        'topic': 'fine-tuning-model-adaptation',
        'label': 'Fine-Tuning & Model Adaptation (LoRA/QLoRA)',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/fine-tuning-model-adaptation'
    },
    {
        'track': 'ai-engineer',
        'topic': 'ai-system-design',
        'label': 'AI System Design & Production ML',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/ai-system-design'
    },
    {
        'track': 'ai-engineer',
        'topic': 'ai-infrastructure-and-scalability',
        'label': 'AI Infrastructure & High-Throughput Serving',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/ai-infrastructure-and-scalability'
    },
    {
        'track': 'ai-engineer',
        'topic': 'llmops-production-ai',
        'label': 'LLMOps & Monitoring in Production',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/llmops-production-ai'
    },
    {
        'track': 'ai-engineer',
        'topic': 'prompt-enginnering',
        'label': 'Prompt Engineering & Reasoning Strategies',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/prompt-enginnering'
    },
    {
        'track': 'ai-engineer',
        'topic': 'evaluation-testing',
        'label': 'Model Evaluation, Benchmarking & Testing',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/evaluation-testing'
    },
    {
        'track': 'ai-engineer',
        'topic': 'ai-safety-and-ethics',
        'label': 'AI Safety, Guardrails & Alignment',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/ai-safety-and-ethics'
    },
    {
        'track': 'ai-engineer',
        'topic': 'multimodal-ai',
        'label': 'Multimodal AI (Vision, Audio & Video)',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/multimodal-ai'
    },
    {
        'track': 'ai-engineer',
        'topic': 'coding-and-practical-implementation',
        'label': 'Coding & Practical Implementation',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/coding-and-practical-implementation'
    },
    {
        'track': 'ai-engineer',
        'topic': 'gen-ai',
        'label': 'Generative AI Concepts & Diffusion',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/gen-ai'
    },
    {
        'track': 'ai-engineer',
        'topic': 'must-do',
        'label': 'Top Must-Do Questions for AI Engineers',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/must-do'
    },
    {
        'track': 'ai-engineer',
        'topic': 'behavioral-scenario-based',
        'label': 'Behavioral & Scenario-Based Questions',
        'url': 'https://joborbit-upstream.app/prep/ai-engineer/behavioral-scenario-based'
    }
]

def determine_difficulty(question: str, answer: str) -> str:
    combined = f"{question} {answer}".lower()
    if any(k in combined for k in ['intern', 'what is', 'difference between', 'basic', 'define', 'explain simple']):
        return 'Easy'
    elif any(k in combined for k in ['architecture', 'tradeoff', 'scale', 'bottleneck', 'optimize', 'qlora', 'distributed', 'pipeline', 'throughput']):
        return 'Hard'
    return 'Medium'

def extract_key_takeaways(answer: str) -> str:
    lines = [line.strip() for line in answer.split('\n') if line.strip()]
    bullet_points = [line for line in lines if line.startswith(('-', '•', '*', '1.', '2.', '3.'))]
    if bullet_points:
        return "\n".join(bullet_points[:4])
    # Fallback to first 2 sentences
    sentences = re.split(r'\.\s+', answer)
    return ". ".join(sentences[:2]) + ("." if len(sentences) > 0 and not sentences[0].endswith('.') else "")

def parse_prep_page(html: str) -> list[dict]:
    questions = []
    seen_q = set()

    # Strategy 1: JSON-LD FAQPage (highest fidelity)
    for m in re.finditer(r'<script type="application/ld\+json">([^<]+)</script>', html):
        try:
            data = json.loads(m.group(1))
            if data.get('@type') == 'FAQPage':
                for item in data.get('mainEntity', []):
                    q_text = item.get('name', '').strip()
                    ans_text = item.get('acceptedAnswer', {}).get('text', '').strip()
                    if q_text and ans_text and q_text not in seen_q:
                        seen_q.add(q_text)
                        questions.append({
                            'question': q_text,
                            'answer': ans_text,
                            'difficulty': determine_difficulty(q_text, ans_text),
                            'key_takeaways': extract_key_takeaways(ans_text)
                        })
        except Exception:
            continue

    # Strategy 2: DOM fallback if JSON-LD missing
    if not questions:
        soup = BeautifulSoup(html, 'html.parser')
        for q_block in soup.find_all(lambda tag: tag.name in ['details', 'div'] and ('accordion' in tag.get('class', []) or 'faq' in tag.get('class', []))):
            summary = q_block.find(['summary', 'h3', 'h4'])
            if not summary:
                continue
            q_text = summary.get_text(strip=True)
            ans_div = q_block.find('div', class_=re.compile(r'content|answer|prose')) or summary.find_next_sibling()
            ans_text = ans_div.get_text(strip=True) if ans_div else ''
            if q_text and ans_text and q_text not in seen_q:
                seen_q.add(q_text)
                questions.append({
                    'question': q_text,
                    'answer': ans_text,
                    'difficulty': determine_difficulty(q_text, ans_text),
                    'key_takeaways': extract_key_takeaways(ans_text)
                })

    return questions

def scrape_prep_questions(app):
    with app.app_context():
        total_added = 0
        total_existing = 0

        for item in PREP_TOPICS:
            track = item['track']
            topic = item['topic']
            label = item['label']
            base_url = settings.SCRAPER_BASE_URL.rstrip('/')
            url = item['url'].replace('https://joborbit-upstream.app', base_url)

            try:
                resp = requests.get(url, headers=REQUEST_HEADERS, timeout=15)
                if resp.status_code != 200:
                    print(f"Failed to fetch {url}: status {resp.status_code}")
                    continue

                items = parse_prep_page(resp.text)
                topic_added = 0

                for q in items:
                    existing = PrepQuestion.query.filter_by(
                        track=track,
                        topic=topic,
                        question=q['question']
                    ).first()

                    if not existing:
                        new_q = PrepQuestion(
                            track=track,
                            topic=topic,
                            topic_label=label,
                            difficulty=q['difficulty'],
                            question=q['question'],
                            answer=q['answer'],
                            key_takeaways=q['key_takeaways']
                        )
                        db.session.add(new_q)
                        topic_added += 1
                        total_added += 1
                    else:
                        total_existing += 1

                db.session.commit()
                print(f"[Prep Ingestion] {label} ({topic}): added {topic_added}, existing {len(items) - topic_added}")
                time.sleep(0.3)
            except Exception as e:
                print(f"Error scraping topic {topic}: {e}")

        print(f"Prep Ingestion Complete: {total_added} added, {total_existing} existing. Total in DB: {PrepQuestion.query.count()}")
        return total_added

if __name__ == '__main__':
    from app import create_app
    app = create_app()
    scrape_prep_questions(app)
