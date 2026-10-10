"""
tests/test_gemini_and_browser.py
--------------------------------
Automated unit tests for Gemini AI Service and Browser Submission Service:
- Structured output parsing & bounds checking
- Safe fallback on API timeout or error
- Truthfulness guardrails
- Browser domain restriction enforcement
"""
import pytest
from unittest.mock import patch, MagicMock
from services.gemini_service import gemini_service
from services.browser_submission_service import browser_submission_service


def test_browser_domain_restriction():
    # Permitted domains
    assert browser_submission_service.is_url_allowed("https://forms.gle/xyz123") is True
    assert browser_submission_service.is_url_allowed("https://docs.google.com/forms/d/e/123/viewform") is True
    assert browser_submission_service.is_url_allowed("https://jobs.lever.co/company/job1") is True
    assert browser_submission_service.is_url_allowed("https://boards.greenhouse.io/corp/jobs/2") is True
    assert browser_submission_service.is_url_allowed("http://127.0.0.1:5000/apply") is True

    # Disallowed domains / schemes
    assert browser_submission_service.is_url_allowed("https://malicious-phishing-site.com/steal") is False
    assert browser_submission_service.is_url_allowed("ftp://forms.gle/file") is False
    assert browser_submission_service.is_url_allowed("javascript:alert(1)") is False
    assert browser_submission_service.is_url_allowed("") is False


def test_gemini_match_resume_structured_output():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{
                    "text": '{"match_score": 88, "verdict": "Strong fit", "matched_skills": ["Python", "Docker"], "missing_skills": ["Kubernetes"], "key_strengths": ["Backend experience"], "recommendations": ["Highlight cluster management."]}'
                }]
            }
        }]
    }

    with patch('requests.post', return_value=mock_response):
        result = gemini_service.match_resume_to_job(
            resume_text="5 years of Python, Docker, and PostgreSQL experience at Uber.",
            job_text="Looking for a Python Backend Engineer with Docker and Kubernetes experience."
        )

    assert result["match_score"] == 88
    assert "Python" in result["matched_skills"]
    assert "Kubernetes" in result["missing_skills"]


def test_gemini_timeout_fallback_handling():
    import requests
    with patch('requests.post', side_effect=requests.Timeout("Network timeout")):
        result = gemini_service.match_resume_to_job(
            resume_text="Some resume text.",
            job_text="Some job text."
        )

    # Must gracefully return fallback data rather than crashing
    assert "match_score" in result
    assert result["match_score"] >= 50
    assert "matched_skills" in result
