"""
services/gemini_service.py
--------------------------
Shared Google Gemini AI Service for JobOrbit:
- Resume-job alignment & gap analysis
- Truthful resume tailoring (grounded strictly in candidate experience)
- Application form answer drafting
- Schema validation, timeouts, bounded retries, and rate-limit backoff.
"""
import os
import json
import time
import logging
from typing import Dict, Any, List, Optional
import requests

from core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        self.model = settings.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.timeout = 12  # seconds per call
        self.max_retries = 2

    def _get_api_url(self) -> str:
        key = self.api_key or os.getenv("GEMINI_API_KEY")
        model = self.model or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        return f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

    def _call_gemini_raw(self, system_instruction: str, user_prompt: str, json_mode: bool = True) -> Optional[str]:
        api_key = self.api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY is not configured.")
            return None

        url = self._get_api_url()
        contents = [
            {
                "parts": [
                    {"text": f"System Directive: {system_instruction}\n\nTask: {user_prompt}"}
                ]
            }
        ]

        generation_config = {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
        }
        if json_mode:
            generation_config["responseMimeType"] = "application/json"

        payload = {
            "contents": contents,
            "generationConfig": generation_config
        }

        for attempt in range(self.max_retries + 1):
            try:
                response = requests.post(url, json=payload, timeout=self.timeout)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
                    return None
                elif response.status_code in (429, 503) and attempt < self.max_retries:
                    wait_time = (2 ** attempt) * 1.5
                    logger.warning(f"Gemini API rate limited/busy ({response.status_code}). Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    logger.error(f"Gemini API returned status {response.status_code}: {response.text[:200]}")
                    return None
            except requests.Timeout:
                logger.warning(f"Gemini API timeout on attempt {attempt + 1}")
                if attempt < self.max_retries:
                    time.sleep(1.0)
                    continue
                return None
            except Exception as e:
                logger.error(f"Gemini API call failed: {e}")
                return None
        return None

    def _parse_json(self, raw_text: Optional[str]) -> Optional[Any]:
        if not raw_text:
            return None
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to parse JSON from Gemini response: {e}. Raw text: {raw_text[:200]}")
            return None

    def match_resume_to_job(self, resume_text: str, job_text: str) -> Dict[str, Any]:
        """
        Deep matching of candidate resume against a specific job description.
        Returns match score (0-100), matched strengths, skill gaps, and evidence points.
        """
        system_instruction = (
            "You are an expert talent acquisition and ATS matching system. "
            "Evaluate the candidate resume against the target job requirements objectively. "
            "CRITICAL: Never fabricate qualifications or assume skills not mentioned in the resume. "
            "Output strictly valid JSON with the following structure: "
            '{"match_score": int, "verdict": str, "matched_skills": [str], "missing_skills": [str], "key_strengths": [str], "recommendations": [str]}'
        )
        user_prompt = f"Target Job Description:\n{job_text[:2500]}\n\nCandidate Resume:\n{resume_text[:3000]}"
        raw = self._call_gemini_raw(system_instruction, user_prompt, json_mode=True)
        parsed = self._parse_json(raw)

        if isinstance(parsed, dict) and "match_score" in parsed:
            # Bound match score between 0 and 100
            score = max(0, min(100, int(parsed.get("match_score", 65))))
            parsed["match_score"] = score
            return parsed

        # Fallback heuristic if API is unreachable or format failed
        return {
            "match_score": 75,
            "verdict": "Moderate Match (Analysis generated via fallback rules)",
            "matched_skills": ["Software Development", "Problem Solving"],
            "missing_skills": [],
            "key_strengths": ["Strong foundational background"],
            "recommendations": ["Highlight domain-specific metrics in experience bullets."]
        }

    def tailor_resume(self, resume_text: str, job_description: str, target_role: str) -> Dict[str, Any]:
        """
        Rephrases and enhances candidate bullet points to align with the job description.
        CRITICAL GUARDRAIL: Only rephrase or emphasize real experiences already in candidate's resume.
        Never invent past employers, projects, degrees, or false metrics.
        """
        system_instruction = (
            "You are a professional resume strategist. "
            "Tailor the candidate's existing experience to best highlight relevance to the target job. "
            "STRICT INTEGRITY RULES: "
            "1. ONLY use verified facts, roles, and projects already present in the candidate resume. "
            "2. NEVER invent companies, degrees, unearned achievements, or fabricated dates. "
            "3. Use strong action verbs and STAR methodology (Situation, Task, Action, Result). "
            "Output valid JSON with the format: "
            '{"summary": str, "tailored_bullets": [{"original": str, "tailored": str, "reason": str}], "suggested_skills": [str]}'
        )
        user_prompt = (
            f"Target Role: {target_role}\n"
            f"Job Description:\n{job_description[:2500]}\n\n"
            f"Original Candidate Resume:\n{resume_text[:3000]}"
        )
        raw = self._call_gemini_raw(system_instruction, user_prompt, json_mode=True)
        parsed = self._parse_json(raw)

        if isinstance(parsed, dict) and "tailored_bullets" in parsed:
            return parsed

        return {
            "summary": "Results-driven engineer aligned with the target role.",
            "tailored_bullets": [],
            "suggested_skills": []
        }

    def draft_application_answers(
        self,
        questions: List[Dict[str, Any]],
        resume_text: str,
        profile_data: Optional[Dict[str, Any]] = None,
        job_text: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Drafts answers for application form fields.
        CRITICAL: Never guess or falsify eligibility declarations (e.g. work authorization, visa, criminal history).
        If information is missing, flags as 'REQUIRES_USER_INPUT'.
        """
        system_instruction = (
            "You are an AI assistant helping a candidate draft accurate, compelling job application form answers. "
            "STRICT RULES: "
            "1. Ground all answers solely in the candidate's real profile and resume. "
            "2. For eligibility/legal/declarative questions (e.g. visa sponsorship, legal right to work, non-competes), "
            "do NOT invent answers if not stated; set confidence to 'LOW' and mark needs_user_confirmation: true. "
            "3. For essay/motivation questions, write a concise, professional answer matching the candidate's voice. "
            "Output valid JSON: a list of objects with schema: "
            '[{"field_id": str, "question": str, "draft_answer": str, "confidence": "HIGH"|"MEDIUM"|"LOW", "needs_user_confirmation": bool, "rationale": str}]'
        )
        user_prompt = (
            f"Target Job Context:\n{job_text[:1500]}\n\n"
            f"Candidate Profile: {json.dumps(profile_data or {})}\n\n"
            f"Candidate Resume Snapshot:\n{resume_text[:2500]}\n\n"
            f"Questions to Answer:\n{json.dumps(questions)}"
        )
        raw = self._call_gemini_raw(system_instruction, user_prompt, json_mode=True)
        parsed = self._parse_json(raw)

        if isinstance(parsed, list):
            return parsed

        # Fallback drafts
        fallback_answers = []
        for q in questions:
            fid = q.get("field_id", q.get("name", "unknown"))
            prompt_q = q.get("question", q.get("label", ""))
            fallback_answers.append({
                "field_id": fid,
                "question": prompt_q,
                "draft_answer": "",
                "confidence": "LOW",
                "needs_user_confirmation": True,
                "rationale": "Manual candidate confirmation needed."
            })
        return fallback_answers


gemini_service = GeminiService()
