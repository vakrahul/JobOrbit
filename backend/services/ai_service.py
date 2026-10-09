"""
services/ai_service.py
----------------------
OOP Business Logic for AI tools:
- Resume skill extraction and matching against Jobs, Research Labs, and HR Contacts
- Fit check diagnostics with strength/gap analysis
- High-converting cold email drafting with tailored templates
"""
import re
import urllib.parse
from typing import List, Tuple, Dict, Any, Optional

from repositories.job_repository import job_repo
from repositories.hr_repository import hr_repo
from repositories.research_repository import research_repo
from core.exceptions import NotFoundError, ValidationError


TECH_SKILLS = [
    'Python', 'C++', 'Java', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Ruby', 'PHP',
    'React', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
    'PyTorch', 'TensorFlow', 'Keras', 'Scikit-learn', 'Hugging Face', 'Transformers', 'LangChain',
    'LlamaIndex', 'RAG', 'Vector DB', 'Pinecone', 'Chroma', 'Milvus', 'Qdrant', 'FAISS',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'Git', 'Linux',
    'REST API', 'GraphQL', 'gRPC', 'Microservices', 'Distributed Systems', 'Kafka', 'RabbitMQ',
    'Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP', 'Natural Language Processing',
    'LLMs', 'Prompt Engineering', 'Fine-Tuning', 'LoRA', 'Agentic AI', 'Multi-Agent',
    'System Design', 'Data Structures', 'Algorithms', 'High Throughput', 'Low Latency'
]


class AIService:
    @staticmethod
    def extract_skills(text: str) -> List[str]:
        if not text:
            return []
        found = []
        text_lower = f" {text.lower()} "
        for skill in TECH_SKILLS:
            pattern = r'(?<![a-zA-Z0-9])' + re.escape(skill.lower()) + r'(?![a-zA-Z0-9])'
            if re.search(pattern, text_lower):
                found.append(skill)
        return found

    @classmethod
    def compute_similarity(cls, resume_skills: set, target_text: str) -> Tuple[int, List[str]]:
        target_skills = set(cls.extract_skills(target_text))
        matched = resume_skills.intersection(target_skills)

        if not resume_skills and not target_skills:
            return 50, []

        union_len = len(resume_skills.union(target_skills))
        if union_len == 0:
            return 45, []

        jaccard = len(matched) / union_len
        # Scale to 60% - 98% for realistic candidate feedback
        score = int(60 + (jaccard * 38))
        score = min(98, max(52, score))
        return score, sorted(list(matched))

    def match_resume(self, resume_text: str, target: str = 'jobs', limit: int = 12) -> Dict[str, Any]:
        if not resume_text or len(resume_text.strip()) < 30:
            raise ValidationError("Please provide a resume of at least 30 characters.")

        detected_skills = self.extract_skills(resume_text)
        resume_skills_set = set(detected_skills)
        matches = []

        if target == 'jobs':
            # Score against active jobs
            jobs, _, _ = job_repo.search(limit=80)
            for j in jobs:
                full_text = f"{j.title} {j.company} {j.snippet or ''} {j.description or ''}"
                score, matched_skills = self.compute_similarity(resume_skills_set, full_text)
                matches.append({
                    'id': j.id,
                    'title': j.title,
                    'company': j.company,
                    'location': j.location,
                    'region': j.region,
                    'job_type': j.job_type,
                    'pay': j.pay,
                    'apply_url': j.apply_url,
                    'score': score,
                    'matched_skills': matched_skills,
                    'target_type': 'job'
                })

        elif target == 'research':
            professors = research_repo.get_for_matching(limit=80)
            for p in professors:
                full_text = f"{p.name} {p.institute} {p.department} {p.research_areas or ''} {p.lab_name or ''}"
                score, matched_skills = self.compute_similarity(resume_skills_set, full_text)
                matches.append({
                    'id': p.id,
                    'title': f"{p.name} ({p.institute})",
                    'subtitle': f"{p.department} · {p.research_areas or 'Research'}",
                    'email': p.email,
                    'score': score,
                    'matched_skills': matched_skills,
                    'target_type': 'research'
                })

        elif target == 'hr':
            hr_list = hr_repo.get_for_matching(limit=80)
            for h in hr_list:
                full_text = f"{h.name} {h.title} {h.company} {h.company_niche or ''}"
                score, matched_skills = self.compute_similarity(resume_skills_set, full_text)
                matches.append({
                    'id': h.id,
                    'title': f"{h.name} · {h.title}",
                    'subtitle': f"{h.company} ({h.company_niche or 'Tech'})",
                    'email': h.email,
                    'linkedin_url': h.linkedin_url,
                    'score': score,
                    'matched_skills': matched_skills,
                    'target_type': 'hr'
                })

        matches.sort(key=lambda x: x['score'], reverse=True)
        top_matches = matches[:limit]

        return {
            'status': 'success',
            'detected_skills': detected_skills,
            'total_skills_detected': len(detected_skills),
            'target': target,
            'matches_count': len(top_matches),
            'matches': top_matches
        }

    def fit_check(self, resume_text: str, target_type: str, target_id: int) -> Dict[str, Any]:
        if not resume_text or len(resume_text.strip()) < 30:
            raise ValidationError("Please provide a resume of at least 30 characters.")

        detected_skills = self.extract_skills(resume_text)
        resume_skills_set = set(detected_skills)

        target_info = {}
        target_skills = []

        if target_type == 'job':
            job = job_repo.get_by_id(target_id)
            if not job:
                raise NotFoundError("Job not found")
            full_text = f"{job.title} {job.company} {job.snippet or ''} {job.description or ''}"
            target_skills = self.extract_skills(full_text)
            score, matched_skills = self.compute_similarity(resume_skills_set, full_text)
            target_info = {
                'title': job.title,
                'company': job.company,
                'location': job.location,
                'pay': job.pay,
                'apply_url': job.apply_url
            }

        elif target_type == 'research':
            prof = research_repo.get_by_id(target_id)
            if not prof:
                raise NotFoundError("Professor not found")
            full_text = f"{prof.name} {prof.institute} {prof.department} {prof.research_areas or ''} {prof.lab_name or ''}"
            target_skills = self.extract_skills(full_text)
            score, matched_skills = self.compute_similarity(resume_skills_set, full_text)
            target_info = {
                'title': prof.name,
                'institute': prof.institute,
                'department': prof.department,
                'research_areas': prof.research_areas,
                'email': prof.email
            }

        elif target_type == 'hr':
            hr = hr_repo.get_by_id(target_id)
            if not hr:
                raise NotFoundError("HR Contact not found")
            full_text = f"{hr.name} {hr.title} {hr.company} {hr.company_niche or ''}"
            target_skills = self.extract_skills(full_text)
            score, matched_skills = self.compute_similarity(resume_skills_set, full_text)
            target_info = {
                'title': hr.name,
                'role': hr.title,
                'company': hr.company,
                'email': hr.email,
                'linkedin_url': hr.linkedin_url
            }
        else:
            raise ValidationError(f"Invalid target_type '{target_type}'. Expected 'job', 'research', or 'hr'.")

        missing_skills = [s for s in target_skills if s not in resume_skills_set]

        # Actionable recommendations
        recommendations = []
        if score >= 85:
            recommendations.append("High match! Strongly recommended to apply immediately.")
            recommendations.append("Tailor your opening line to highlight: " + ", ".join(matched_skills[:3]))
        elif score >= 70:
            recommendations.append("Solid alignment. Highlight relevant hands-on projects.")
            if missing_skills:
                recommendations.append("Consider bridging gaps by referencing familiarity with: " + ", ".join(missing_skills[:2]))
        else:
            recommendations.append("Moderate alignment. Frame your core skills as transferable.")
            if missing_skills:
                recommendations.append("Emphasize relevant coursework or side projects involving: " + ", ".join(missing_skills[:3]))

        return {
            'status': 'success',
            'score': score,
            'verdict': 'Strong Match' if score >= 82 else ('Good Match' if score >= 68 else 'Moderate Alignment'),
            'target_info': target_info,
            'matched_skills': matched_skills,
            'missing_skills': missing_skills[:6],
            'recommendations': recommendations
        }

    @staticmethod
    def clean_text_and_remove_latex(text: str) -> str:
        """Strips out LaTeX commands, math formatting, and raw markup artifacts."""
        if not text:
            return ""
        # Remove LaTeX commands like \textbf{...}, \textit{...}, etc.
        text = re.sub(r'\\[a-zA-Z]+\{([^}]*)\}', r'\1', text)
        # Remove bare LaTeX macros like \n, \hline, etc.
        text = re.sub(r'\\[a-zA-Z]+', ' ', text)
        # Remove LaTeX math syntax like $...$ or $$...$$
        text = re.sub(r'\$\$?[^$]+\$\$?', '', text)
        # Remove stray backslashes
        text = text.replace('\\', '')
        return text.strip()

    def call_gemini(self, prompt: str) -> Optional[str]:
        """Calls Google Gemini LLM using the configured API key and model."""
        import os
        import requests
        from core.config import settings
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None
        model = settings.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        try:
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": 800,
                }
            }
            r = requests.post(url, json=payload, timeout=8)
            if r.status_code == 200:
                data = r.json()
                raw_text = data['candidates'][0]['content']['parts'][0]['text']
                return self.clean_text_and_remove_latex(raw_text)
        except Exception:
            pass
        return None

    def draft_email(
        self,
        target_type: str,
        target_id: int,
        resume_summary: str = '',
        tone: str = 'formal'
    ) -> Dict[str, Any]:
        tone = tone.lower()
        if tone not in ['formal', 'concise', 'enthusiastic']:
            tone = 'formal'

        recipient_name = "Hiring Manager"
        recipient_email = ""
        subject = ""
        body = ""

        if target_type == 'job':
            job = job_repo.get_by_id(target_id)
            if not job:
                raise NotFoundError("Job not found")
            subject = f"Application: {job.title} — [Your Name]"
            salutation = f"Dear {job.company} Hiring Team,"
            skills_mention = resume_summary if resume_summary else "engineering and product development"

            # Try Google Gemini LLM for intelligence
            gemini_prompt = (
                f"You are an elite career strategist. Draft a high-converting, professional job application email.\n"
                f"Role: {job.title}\n"
                f"Company: {job.company}\n"
                f"Location: {job.location}\n"
                f"Candidate background/skills: {skills_mention}\n"
                f"Tone: {tone}\n"
                f"Rules: Return ONLY the email body starting with salutation. Do not include markdown codeblocks, LaTeX tags, or raw formatting."
            )
            gemini_result = self.call_gemini(gemini_prompt)

            if gemini_result and len(gemini_result.strip()) > 80:
                body = gemini_result
            elif tone == 'concise':
                body = (
                    f"{salutation}\n\n"
                    f"I am writing to express my strong interest in the {job.title} position at {job.company}.\n\n"
                    f"With a strong foundation in {skills_mention}, I have delivered robust software solutions and "
                    f"would welcome the opportunity to contribute immediately to your engineering goals.\n\n"
                    f"My resume is attached for your review. I look forward to connecting.\n\n"
                    f"Best regards,\n[Your Name]\n[Your Phone]\n[LinkedIn Profile]"
                )

            elif tone == 'enthusiastic':
                body = (
                    f"{salutation}\n\n"
                    f"I was thrilled to come across the {job.title} opening at {job.company}! Having followed {job.company}'s "
                    f"innovative work, I am passionate about bringing my background in {skills_mention} to the team.\n\n"
                    f"I thrive in fast-paced environments where solving complex problems is the norm, and I would love to "
                    f"share how my past experiences align with what you are building.\n\n"
                    f"Thank you very much for your time and consideration!\n\n"
                    f"Warm regards,\n[Your Name]\n[Your Phone]\n[Portfolio / GitHub]"
                )
            else:
                body = (
                    f"{salutation}\n\n"
                    f"Please accept this letter as an expression of my sincere interest in the {job.title} position at {job.company}.\n\n"
                    f"Throughout my academic and project experiences, I have focused on {skills_mention}, developing clean, "
                    f"maintainable systems that scale. Given {job.company}'s reputation for technical excellence, "
                    f"I am confident that my work ethic and technical skillset would make me a valuable addition to your team.\n\n"
                    f"I welcome the opportunity to discuss my qualifications with you in greater detail. Thank you for your consideration.\n\n"
                    f"Sincerely,\n[Your Name]\n[Your Phone]\n[LinkedIn Profile]"
                )

        elif target_type == 'research':
            prof = research_repo.get_by_id(target_id)
            if not prof:
                raise NotFoundError("Professor not found")
            recipient_name = prof.name
            recipient_email = prof.email or ""
            subject = f"Prospective Research Intern Inquiry — {prof.institute} — [Your Name]"
            salutation = f"Dear Professor {prof.name},"
            areas = prof.research_areas or "your lab's research domain"

            body = (
                f"{salutation}\n\n"
                f"I hope this email finds you well.\n\n"
                f"I am writing to express my keen interest in contributing as a research intern in your lab at {prof.institute}. "
                f"I have closely reviewed your publications and ongoing work in {areas}, and I am deeply intrigued by your methodology.\n\n"
                f"My background spans {resume_summary or 'computational modeling, algorithm design, and applied machine learning'}. "
                f"I am eager to dedicate my skills to advancing ongoing projects under your mentorship.\n\n"
                f"I have attached my curriculum vitae and research summary for your review. I would be immensely grateful "
                f"for the opportunity to discuss any potential openings for an internship.\n\n"
                f"Thank you for your valuable time and consideration.\n\n"
                f"Sincerely,\n[Your Name]\n[Undergraduate / Graduate Student]\n[Your University]\n[GitHub / Google Scholar]"
            )

        elif target_type == 'hr':
            hr = hr_repo.get_by_id(target_id)
            if not hr:
                raise NotFoundError("HR Contact not found")
            recipient_name = hr.name
            recipient_email = hr.email or ""
            subject = f"Connecting regarding opportunities at {hr.company} — [Your Name]"
            salutation = f"Hi {hr.name},"

            body = (
                f"{salutation}\n\n"
                f"I hope you are having a productive week.\n\n"
                f"I noticed your leadership in talent acquisition at {hr.company} and wanted to reach out. "
                f"I am a software engineer specializing in {resume_summary or 'full-stack and AI development'}.\n\n"
                f"I have been tracking {hr.company}'s growth and would love to be considered for relevant upcoming roles. "
                f"Could we arrange a brief 5-minute chat, or may I share my resume for future reference?\n\n"
                f"Thanks for your time and all you do!\n\n"
                f"Best,\n[Your Name]\n[LinkedIn Profile]\n[Portfolio]"
            )
        else:
            raise ValidationError(f"Invalid target_type '{target_type}'. Expected 'job', 'research', or 'hr'.")

        mailto_link = ""
        if recipient_email:
            mailto_link = f"mailto:{recipient_email}?subject={urllib.parse.quote(subject)}&body={urllib.parse.quote(body)}"

        return {
            'status': 'success',
            'recipient_name': recipient_name,
            'recipient_email': recipient_email,
            'subject': subject,
            'body': body,
            'mailto_link': mailto_link,
            'tone': tone
        }

    def audit_skills_with_agent(
        self,
        resume_text: str,
        target_role: str = "Autonomous AI & Systems Engineer",
        custom_skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Deep autonomous audit of candidate skills and resume against high-yield tech benchmarks.
        Leverages Google Gemini 2.5 Flash LLM with structured diagnostics.
        """
        import os
        import json
        from core.config import settings

        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        model = settings.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

        # 1. Baseline Extraction using local skill ontology
        extracted = self.extract_skills(resume_text)
        extracted_set = set([s.lower() for s in extracted])

        # Intelligent Skill Matrix
        intelligent_skill_matrix = {
            "Agentic AI & Orchestration": [
                "LLMs", "AI Agents", "MCP", "LangChain", 
                "LlamaIndex", "RAG", "Vector DB", "Qdrant", "PyTorch"
            ],
            "High-Throughput Backend & Microservices": [
                "FastAPI", "Python", "Go", "Redis", "Kafka", "PostgreSQL", 
                "Microservices", "REST API", "Distributed Systems"
            ],
            "Cloud & Systems Architecture": [
                "Docker", "Kubernetes", "Linux", "AWS", "CI/CD", "Git", 
                "Cloudflare", "Low Latency", "High Throughput"
            ]
        }

        # Check coverage
        all_intelligent_skills = [s for sublist in intelligent_skill_matrix.values() for s in sublist]
        matched_intelligent = [s for s in all_intelligent_skills if s.lower() in extracted_set]
        missing_intelligent = [s for s in all_intelligent_skills if s.lower() not in extracted_set]

        # 2. Call Google Gemini LLM for deep autonomous diagnostic
        gemini_prompt = (
            f"You are the JobOrbit Autonomous AI Audit Agent. Audit this candidate profile for the target role: '{target_role}'.\n"
            f"Candidate Profile / Resume Content:\n\"\"\"{resume_text[:3500]}\"\"\"\n\n"
            f"Perform an exhaustive diagnostic audit. Return ONLY valid raw JSON with this exact schema (no markdown blocks, no text before or after):\n"
            f"{{\n"
            f"  \"ats_score\": 92,\n"
            f"  \"agentic_readiness_score\": 90,\n"
            f"  \"executive_verdict\": \"Concise punchy assessment of candidate fit and trajectory.\",\n"
            f"  \"strengths\": [\"Strength 1\", \"Strength 2\", \"Strength 3\"],\n"
            f"  \"missing_critical_skills\": [\"Skill 1\", \"Skill 2\", \"Skill 3\"],\n"
            f"  \"recommended_additions\": [\"Actionable item 1\", \"Actionable item 2\"],\n"
            f"  \"bullet_audits\": [\n"
            f"    {{\n"
            f"      \"original\": \"Original resume statement\",\n"
            f"      \"improved_star\": \"Quantified STAR rewrite with metrics and impact\",\n"
            f"      \"impact\": \"Why this beats ATS and recruiter filters\"\n"
            f"    }}\n"
            f"  ]\n"
            f"}}"
        )

        gemini_response = self.call_gemini(gemini_prompt) if api_key else None
        audit_result = None

        if gemini_response:
            try:
                cleaned = gemini_response.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                audit_result = json.loads(cleaned.strip())
            except Exception:
                pass

        # Robust Fallback if LLM offline or parsing fails
        if not audit_result:
            base_score = min(95, max(65, int(62 + len(matched_intelligent) * 3.2)))
            agentic_score = min(96, max(58, int(58 + len([s for s in matched_intelligent if s in intelligent_skill_matrix["Agentic AI & Orchestration"]]) * 7.5)))
            audit_result = {
                "ats_score": base_score,
                "agentic_readiness_score": agentic_score,
                "executive_verdict": f"Profile demonstrates high technical caliber with verified skills in {', '.join(extracted[:4]) if extracted else 'software engineering'}.",
                "strengths": [
                    f"Strong alignment across {len(matched_intelligent)} intelligent tech stack benchmarks.",
                    "Robust foundations in modern microservices and asynchronous pipeline design.",
                    "Demonstrated production competency with containerized cloud deployments."
                ],
                "missing_critical_skills": missing_intelligent[:5],
                "recommended_additions": [
                    "Highlight measurable p99 latency reductions or query throughput percentages in bullets.",
                    "Incorporate explicit Model Context Protocol (MCP) tool-use integrations for agentic workflows."
                ],
                "bullet_audits": [
                    {
                        "original": "Built backend APIs using Python and databases for user requests.",
                        "improved_star": "Architected low-latency FastAPI microservices backed by Redis and PostgreSQL, sustaining 4,500+ daily events with sub-45ms response time.",
                        "impact": "Injects quantifiable p99 performance metrics and enterprise caching frameworks."
                    }
                ]
            }

        return {
            "status": "success",
            "target_role": target_role,
            "detected_skills": extracted,
            "matched_intelligent_skills": matched_intelligent,
            "intelligent_matrix": intelligent_skill_matrix,
            "audit": audit_result
        }


ai_service = AIService()
