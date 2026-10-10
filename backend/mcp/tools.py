"""
mcp/tools.py
------------
Model Context Protocol (MCP) Tool definitions and handlers for ChatGPT.
Exposes 13 explicitly authorized tools sharing the same database, user identity,
Gemini AI service, and mandatory application approval workflow as JobOrbit.
"""
import json
import logging
from typing import Dict, Any, List, Optional

from core.extensions import db
from core.exceptions import NotFoundError, ValidationError, UnauthorizedError
from repositories.job_repository import job_repo
from services.gemini_service import gemini_service
from services.application_service import application_service
from services.browser_submission_service import browser_submission_service
from models.user import User, SavedJob
from models.application import AuditEvent

logger = logging.getLogger(__name__)

# ── 13 MCP Tool Schemas ────────────────────────────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "name": "search_jobs",
        "description": "Search active job listings on JobOrbit with keyword, location, and work-mode filters.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Keywords, job title, skills, or company name."},
                "location": {"type": "string", "description": "City, state, or country filter."},
                "work_mode": {"type": "string", "enum": ["remote", "hybrid", "on-site", "all"], "description": "Work style preference."},
                "limit": {"type": "integer", "description": "Maximum number of results (default 10, max 30).", "default": 10}
            }
        }
    },
    {
        "name": "get_job_details",
        "description": "Fetch detailed description, requirements, company info, and application URL for a specific job.",
        "inputSchema": {
            "type": "object",
            "required": ["job_id"],
            "properties": {
                "job_id": {"type": "integer", "description": "Unique identifier of the JobOrbit job listing."}
            }
        }
    },
    {
        "name": "get_my_profile",
        "description": "Retrieve the authenticated candidate's JobOrbit profile, tier status, and saved application statistics.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "match_resume",
        "description": "Analyze candidate resume alignment against a job description using Gemini AI. Returns objective match score, verified strengths, and missing skills.",
        "inputSchema": {
            "type": "object",
            "required": ["resume_text"],
            "properties": {
                "resume_text": {"type": "string", "description": "Raw text snapshot of the candidate's resume."},
                "job_id": {"type": "integer", "description": "Optional JobOrbit job ID to compare against."},
                "job_description": {"type": "string", "description": "Optional full text of the job description."}
            }
        }
    },
    {
        "name": "tailor_resume",
        "description": "Tailor candidate experience bullets for a specific job using Gemini AI and STAR methodology. Strictly restricted to verified candidate facts.",
        "inputSchema": {
            "type": "object",
            "required": ["resume_text", "target_role", "job_description"],
            "properties": {
                "resume_text": {"type": "string", "description": "Raw text snapshot of the candidate's verified resume."},
                "target_role": {"type": "string", "description": "Job title/role being applied for."},
                "job_description": {"type": "string", "description": "Full text of target job requirements."}
            }
        }
    },
    {
        "name": "draft_application_answers",
        "description": "Draft truthful application form responses using Gemini AI grounded strictly in candidate experience. Flags eligibility declarations for manual review.",
        "inputSchema": {
            "type": "object",
            "required": ["resume_text", "questions"],
            "properties": {
                "resume_text": {"type": "string", "description": "Candidate's verified resume snapshot."},
                "questions": {
                    "type": "array",
                    "description": "List of form question prompts to draft answers for.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field_id": {"type": "string"},
                            "question": {"type": "string"}
                        },
                        "required": ["question"]
                    }
                },
                "job_description": {"type": "string", "description": "Contextual job description."}
            }
        }
    },
    {
        "name": "save_job",
        "description": "Save a job listing to the candidate's JobOrbit account for quick access.",
        "inputSchema": {
            "type": "object",
            "required": ["job_id"],
            "properties": {
                "job_id": {"type": "integer", "description": "ID of the job to save."}
            }
        }
    },
    {
        "name": "prepare_application",
        "description": "Prepare a structured application draft in JobOrbit with cryptographic SHA-256 hash binding. Initial status is DRAFT.",
        "inputSchema": {
            "type": "object",
            "required": ["target_role", "company_name", "destination_url", "resume_text"],
            "properties": {
                "job_id": {"type": "integer", "description": "Optional JobOrbit job ID."},
                "target_role": {"type": "string", "description": "Title of the position."},
                "company_name": {"type": "string", "description": "Name of the hiring company."},
                "destination_url": {"type": "string", "description": "Application landing page or form URL."},
                "resume_text": {"type": "string", "description": "Exact resume snapshot used for this application."},
                "answers": {"type": "object", "description": "Key-value map of form field answers."},
                "declarations": {"type": "object", "description": "Eligibility declarations."},
                "notes": {"type": "string", "description": "Optional candidate notes."}
            }
        }
    },
    {
        "name": "get_application_preview",
        "description": "Inspect an existing application draft, its answers, resume text snapshot, content hash, and current approval state.",
        "inputSchema": {
            "type": "object",
            "required": ["draft_id"],
            "properties": {
                "draft_id": {"type": "integer", "description": "ID of the application draft."}
            }
        }
    },
    {
        "name": "request_application_approval",
        "description": "Generate an approval request for the candidate with content hash binding and human review URL. Mandatory before any submission.",
        "inputSchema": {
            "type": "object",
            "required": ["draft_id"],
            "properties": {
                "draft_id": {"type": "integer", "description": "ID of the prepared draft."}
            }
        }
    },
    {
        "name": "submit_approved_application",
        "description": "Submit an application to an external destination. Hard-blocks submission unless valid, explicit user approval token is provided and consumed.",
        "inputSchema": {
            "type": "object",
            "required": ["draft_id", "approval_token", "idempotency_key"],
            "properties": {
                "draft_id": {"type": "integer", "description": "ID of the draft to submit."},
                "approval_token": {"type": "string", "description": "Cryptographic approval token confirmed by candidate."},
                "idempotency_key": {"type": "string", "description": "Unique UUID/nonce to prevent duplicate submissions."}
            }
        }
    },
    {
        "name": "get_submission_status",
        "description": "Check the status and receipt of an application submission attempt.",
        "inputSchema": {
            "type": "object",
            "required": ["submission_id"],
            "properties": {
                "submission_id": {"type": "integer", "description": "ID of the submission attempt."}
            }
        }
    },
    {
        "name": "list_my_applications",
        "description": "List all application drafts and submissions for the authenticated candidate.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    }
]


# ── Tool Dispatch Handler ─────────────────────────────────────────────────────

def dispatch_tool(user: User, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes an MCP tool with authenticated user context.
    NEVER trusts candidate ID from arguments; always uses user.id.
    """
    if not user:
        return {"isError": True, "content": [{"type": "text", "text": "Unauthorized: Valid user session required."}]}

    arguments = arguments or {}

    try:
        AuditEvent.log(
            event_type='mcp_tool_call',
            entity_type='mcp',
            entity_id=tool_name,
            user_id=user.id,
            payload={'tool': tool_name, 'args_keys': list(arguments.keys())}
        )

        if tool_name == "search_jobs":
            query = arguments.get("query", "")
            location = arguments.get("location", "")
            work_mode = arguments.get("work_mode", "all")
            limit = min(30, max(1, int(arguments.get("limit", 10))))

            jobs, total, _ = job_repo.search(
                q=query,
                location=location,
                remote=(work_mode == "remote"),
                limit=limit
            )
            data = [
                {
                    "id": j.id,
                    "title": j.title,
                    "company": j.company,
                    "location": j.location,
                    "is_remote": 'remote' in (j.location or '').lower() or 'remote' in (j.title or '').lower(),
                    "pay": getattr(j, 'pay', 'Competitive'),
                    "apply_url": j.apply_url,
                    "snippet": j.snippet
                } for j in jobs
            ]
            return {"content": [{"type": "text", "text": json.dumps({"total_matches": total, "jobs": data}, indent=2)}]}

        elif tool_name == "get_job_details":
            job_id = int(arguments.get("job_id", 0))
            job = job_repo.get_by_id(job_id)
            if not job:
                return {"isError": True, "content": [{"type": "text", "text": f"Job {job_id} not found."}]}
            return {"content": [{"type": "text", "text": json.dumps(job.to_dict(), indent=2)}]}

        elif tool_name == "get_my_profile":
            saved_count = SavedJob.query.filter_by(user_id=user.id).count()
            apps_count = len(application_service.list_user_applications(user.id))
            profile = {
                "user_id": user.id,
                "email": user.email,
                "full_name": user.full_name or "JobOrbit Candidate",
                "tier": getattr(user, 'tier', 'FREE'),
                "saved_jobs_count": saved_count,
                "applications_count": apps_count
            }
            return {"content": [{"type": "text", "text": json.dumps(profile, indent=2)}]}

        elif tool_name == "match_resume":
            resume_text = arguments.get("resume_text", "")
            if not resume_text:
                return {"isError": True, "content": [{"type": "text", "text": "resume_text is required."}]}

            job_text = arguments.get("job_description", "")
            job_id = arguments.get("job_id")
            if not job_text and job_id:
                job = job_repo.get_by_id(int(job_id))
                if job:
                    job_text = f"{job.title} at {job.company}\n{job.description or job.snippet or ''}"

            if not job_text:
                job_text = "General software development and technology role."

            result = gemini_service.match_resume_to_job(resume_text, job_text)
            return {"content": [{"type": "text", "text": json.dumps(result, indent=2)}]}

        elif tool_name == "tailor_resume":
            resume_text = arguments.get("resume_text", "")
            target_role = arguments.get("target_role", "")
            job_desc = arguments.get("job_description", "")
            if not resume_text or not target_role or not job_desc:
                return {"isError": True, "content": [{"type": "text", "text": "resume_text, target_role, and job_description are all required."}]}

            result = gemini_service.tailor_resume(resume_text, job_desc, target_role)
            return {"content": [{"type": "text", "text": json.dumps(result, indent=2)}]}

        elif tool_name == "draft_application_answers":
            resume_text = arguments.get("resume_text", "")
            questions = arguments.get("questions", [])
            job_desc = arguments.get("job_description", "")
            if not resume_text or not questions:
                return {"isError": True, "content": [{"type": "text", "text": "resume_text and questions list are required."}]}

            result = gemini_service.draft_application_answers(
                questions=questions,
                resume_text=resume_text,
                profile_data={"full_name": user.full_name, "email": user.email},
                job_text=job_desc
            )
            return {"content": [{"type": "text", "text": json.dumps(result, indent=2)}]}

        elif tool_name == "save_job":
            job_id = int(arguments.get("job_id", 0))
            job = job_repo.get_by_id(job_id)
            if not job:
                return {"isError": True, "content": [{"type": "text", "text": f"Job {job_id} not found."}]}

            existing = SavedJob.query.filter_by(user_id=user.id, job_id=job.id).first()
            if not existing:
                saved = SavedJob(user_id=user.id, job_id=job.id)
                db.session.add(saved)
                db.session.commit()
            return {"content": [{"type": "text", "text": json.dumps({"success": True, "message": f"Job '{job.title}' saved to your account."}, indent=2)}]}

        elif tool_name == "prepare_application":
            draft = application_service.create_draft(
                user_id=user.id,
                target_role=arguments.get("target_role", ""),
                company_name=arguments.get("company_name", ""),
                destination_url=arguments.get("destination_url", ""),
                resume_text=arguments.get("resume_text", ""),
                job_id=arguments.get("job_id"),
                answers=arguments.get("answers", {}),
                declarations=arguments.get("declarations", {}),
                notes=arguments.get("notes")
            )
            return {"content": [{"type": "text", "text": json.dumps(draft.to_dict(), indent=2)}]}

        elif tool_name == "get_application_preview":
            draft_id = int(arguments.get("draft_id", 0))
            draft = application_service.get_draft(user.id, draft_id)
            return {"content": [{"type": "text", "text": json.dumps(draft.to_dict(), indent=2)}]}

        elif tool_name == "request_application_approval":
            draft_id = int(arguments.get("draft_id", 0))
            approval_info = application_service.request_approval(user.id, draft_id)
            return {"content": [{"type": "text", "text": json.dumps(approval_info, indent=2)}]}

        elif tool_name == "submit_approved_application":
            draft_id = int(arguments.get("draft_id", 0))
            approval_token = arguments.get("approval_token", "")
            idempotency_key = arguments.get("idempotency_key", "")
            result = application_service.submit_application(
                user_id=user.id,
                draft_id=draft_id,
                approval_token=approval_token,
                idempotency_key=idempotency_key,
                browser_service=browser_submission_service
            )
            return {"content": [{"type": "text", "text": json.dumps(result, indent=2)}]}

        elif tool_name == "get_submission_status":
            submission_id = int(arguments.get("submission_id", 0))
            result = application_service.get_submission_status(user.id, submission_id)
            return {"content": [{"type": "text", "text": json.dumps(result, indent=2)}]}

        elif tool_name == "list_my_applications":
            applications = application_service.list_user_applications(user.id)
            return {"content": [{"type": "text", "text": json.dumps({"applications": applications}, indent=2)}]}

        else:
            return {"isError": True, "content": [{"type": "text", "text": f"Unknown tool: {tool_name}"}]}

    except (ValidationError, UnauthorizedError, NotFoundError) as e:
        return {"isError": True, "content": [{"type": "text", "text": str(e)}]}
    except Exception as exc:
        logger.error(f"Error executing MCP tool {tool_name}: {exc}", exc_info=True)
        return {"isError": True, "content": [{"type": "text", "text": f"Internal execution error: {str(exc)}"}]}
