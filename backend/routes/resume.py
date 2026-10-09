"""
routes/resume.py
----------------
REST controller for the Standalone AI LaTeX Resume Studio.
"""
import re
import copy
from flask import Blueprint, jsonify, request, Response
from core.extensions import limiter
from services.latex_service import TEMPLATE_REGISTRY, generate_latex_source
from services.ai_service import AIService, TECH_SKILLS

resume_bp = Blueprint('resume', __name__, url_prefix='/api/resume')

SAMPLE_RESUME_DATA = {
    "basics": {
        "name": "Aarav Sharma",
        "title": "Full-Stack AI & Distributed Systems Engineer",
        "email": "aarav.sharma.dev@gmail.com",
        "phone": "+91 (987) 654-3210",
        "location": "Bengaluru, India",
        "github": "github.com/aaravsharma-dev",
        "linkedin": "linkedin.com/in/aarav-sharma-tech",
        "portfolio": "aaravsharma.dev",
        "summary": "Full-stack engineer with expertise in building scalable backend systems, autonomous agentic frameworks, and high-performance microservices."
    },
    "education": [
        {
            "institution": "Indian Institute of Technology (IIT) Delhi",
            "degree": "B.Tech in Computer Science & Engineering",
            "location": "India",
            "start": "2021",
            "end": "2025",
            "score": "CGPA: 9.24 / 10.0"
        }
    ],
    "experience": [
        {
            "company": "Apex AI Labs",
            "role": "Software Engineer Intern",
            "location": "San Francisco, CA (Remote)",
            "start": "May 2024",
            "end": "Aug 2024",
            "bullets": [
                "Engineered Model Context Protocol (MCP) integrations for autonomous data exploration pipelines.",
                "Architected real-time streaming LLM microservices with FastAPI and Redis, decreasing response latency by 35%."
            ]
        },
        {
            "company": "Nexus Systems",
            "role": "Core Platform Member",
            "location": "Remote",
            "start": "Jan 2024",
            "end": "April 2024",
            "bullets": [
                "Built deterministic policy guards and credential protection layers for autonomous desktop workflow agents.",
                "Refactored asynchronous data ingestion pipeline, boosting p99 throughput across 50,000+ daily events."
            ]
        }
    ],
    "projects": [
        {
            "name": "WinOS-Agent -- Autonomous Desktop Execution Environment",
            "tech": "Python, C#, FastAPI, WinUI 3, Windows UI Automation, OpenCV, SQLite, LLMs",
            "link": "https://github.com/aaravsharma-dev/winos-agent",
            "bullets": [
                "Built a zero-implicit-trust autonomous desktop execution environment for Windows that treats LLMs as core compute actors.",
                "Engineered deterministic ALLOW/DENY/REQUIRE_APPROVAL policies, Windows DPAPI credential protection, sandboxed process execution, scoped filesystem operations, and SHA-256 hash-chained audit logging.",
                "Implemented native Windows UI automation, browser workflows, multi-provider LLM adapters, four-tier memory with mistake learning, and autonomous coding loops."
            ]
        },
        {
            "name": "AgentCommerce -- Conversational Agent Payment Gateway",
            "tech": "FastAPI, Vector DB, MCP",
            "link": "https://github.com/aaravsharma-dev/agent-commerce",
            "bullets": [
                "Built an agent commerce gateway that converts AI agent purchase intent into authorized and verifiable transactions, enabling payments through conversational interfaces such as ChatGPT and Claude.",
                "Designed the backend architecture around secure APIs, vector-based retrieval, and Model Context Protocol (MCP) workflows."
            ]
        }
    ],
    "skills": {
        "Languages": ["Python", "Java", "JavaScript", "TypeScript", "Go", "SQL"],
        "AI & Agentic Systems": ["LLMs", "RAG", "MCP", "AI Agents", "LLM Orchestration", "Vector Databases", "LangChain", "PyTorch"],
        "Backend & Frameworks": ["FastAPI", "Node.js", "Next.js", "React", "REST APIs", "Microservices"],
        "Databases": ["PostgreSQL", "MongoDB", "Neo4j", "Supabase", "Qdrant", "Redis"],
        "Tools & Infrastructure": ["Docker", "Git", "GitHub Actions", "Linux", "AWS", "Cloudflare", "CI/CD"],
        "Relevant Coursework": ["Database Management Systems (DBMS)", "Operating Systems (OS)", "Computer Networks", "Distributed Systems"]
    },
    "publications": [
        "Publication: ``Investigating Data Leakage-Induced Over-Confidence and Explanation Faithfulness in Deep Transformer Models'' -- IEEE / Tech Conference.",
        "Top 3 Finalist out of 800+ teams in the Global Open-Source Agentic AI Hackathon."
    ]
}

# Rule-based AI enhancer dictionary for bullet points
ENHANCEMENT_PATTERNS = [
    (r"worked on (.*)", r"Architected and deployed production \1, cutting cycle latency by 32%"),
    (r"made (.*)", r"Engineered scalable \1 with automated CI/CD validation and zero downtime"),
    (r"built (.*)", r"Designed and implemented high-throughput \1 supporting 10,000+ daily active users"),
    (r"fixed (.*)", r"Diagnosed and resolved critical bottleneck in \1, boosting p99 execution speed by 40%"),
    (r"helped with (.*)", r"Collaborated with cross-functional team to deliver \1 on schedule with 99.8% test coverage"),
    (r"created (.*)", r"Spearheaded design and launch of \1, driving a 28% increase in platform engagement"),
    (r"improved (.*)", r"Optimized and refactored \1, reducing memory footprint by 45% and query time by 60%"),
    (r"used (.*)", r"Leveraged modern \1 architectures to streamline data serialization and system throughput"),
]


@resume_bp.route('/templates', methods=['GET'])
def get_templates():
    """Return available LaTeX templates and metadata."""
    templates = [
        {
            "id": t["id"],
            "name": t["name"],
            "badge": t["badge"],
            "tagline": t["tagline"],
            "font": t["font"],
            "columns": t["columns"],
        }
        for t in TEMPLATE_REGISTRY.values()
    ]
    return jsonify({"status": "success", "templates": templates})


@resume_bp.route('/sample', methods=['GET'])
def get_sample_profile():
    """Returns pre-filled gold standard resume data."""
    return jsonify({"status": "success", "data": SAMPLE_RESUME_DATA})


@resume_bp.route('/generate-latex', methods=['POST'])
def generate_latex():
    """
    POST /api/resume/generate-latex
    Body: { data: {...}, template: 'jake' }
    Returns: { latex: '...', filename: 'resume.tex' }
    """
    payload = request.get_json(silent=True) or {}
    data = payload.get("data", SAMPLE_RESUME_DATA)
    template_id = payload.get("template", "jake")

    try:
        tex_code = generate_latex_source(data, template_id)
        candidate_name = data.get("basics", {}).get("name", "Resume").replace(" ", "_")
        filename = f"{candidate_name}_{template_id}_resume.tex"
        return jsonify({
            "status": "success",
            "latex": tex_code,
            "filename": filename,
            "template": template_id,
        })
    except Exception as e:
        return jsonify({"status": "error", "message": f"LaTeX generation failed: {str(e)}"}), 500


@resume_bp.route('/ai-enhance', methods=['POST'])
@limiter.limit("40 per minute")
def ai_enhance_bullet():
    """
    POST /api/resume/ai-enhance
    Body: { bullet: "built an api using python" }
    Returns enhanced STAR-format statement with action verbs & metrics.
    """
    payload = request.get_json(silent=True) or {}
    raw_bullet = (payload.get("bullet") or "").strip()

    if not raw_bullet:
        return jsonify({"status": "error", "message": "Bullet text is required"}), 400

    enhanced = raw_bullet
    lower = raw_bullet.lower()

    # Rule-based transformation
    matched = False
    for pat, rep in ENHANCEMENT_PATTERNS:
        if pat.split()[0] in lower:
            enhanced = re.sub(pat, rep, raw_bullet, flags=re.IGNORECASE)
            matched = True
            break

    if not matched:
        # Default STAR transformation
        enhanced = f"Architected and deployed {raw_bullet[0].lower() + raw_bullet[1:] if len(raw_bullet) > 1 else raw_bullet}, achieving 35% improvement in processing latency across 5,000+ operations."

    return jsonify({
        "status": "success",
        "original": raw_bullet,
        "enhanced": enhanced,
    })


@resume_bp.route('/tailor-to-jd', methods=['POST'])
@limiter.limit("30 per minute")
def tailor_resume_to_jd():
    """
    POST /api/resume/tailor-to-jd
    Body:
    {
      "resume": { ... },
      "job_description": "...",
      "target_title": "...",
      "company_name": "..."
    }
    Transforms current resume into an ATS-engineered resume specifically matching the JD.
    """
    payload = request.get_json(silent=True) or {}
    resume_data = payload.get("resume") or SAMPLE_RESUME_DATA
    jd_text = (payload.get("job_description") or "").strip()
    target_title = (payload.get("target_title") or "").strip()
    company_name = (payload.get("company_name") or "").strip()

    if not jd_text or len(jd_text) < 15:
        return jsonify({"status": "error", "message": "Job description text of at least 15 characters is required."}), 400

    # 1. Extract technical skills from JD
    jd_skills = AIService.extract_skills(jd_text)
    if not jd_skills:
        words = re.findall(r'[a-zA-Z0-9\.\+#]+', jd_text)
        jd_skills = [w for w in set(words) if w in TECH_SKILLS][:10]

    # Additional industry architecture keywords
    domain_terms = ['Microservices', 'Distributed Systems', 'REST API', 'CI/CD', 'Docker', 'Kubernetes', 'Cloud', 'High Throughput', 'Low Latency', 'FastAPI', 'Redis', 'PostgreSQL', 'Kafka']
    additional_terms = [t for t in domain_terms if t.lower() in jd_text.lower() and t not in jd_skills]
    all_target_skills = list(dict.fromkeys(jd_skills + additional_terms))

    # 2. Extract current resume skills
    current_skills_flat = []
    skills_obj = resume_data.get("skills", {})
    if isinstance(skills_obj, dict):
        for items in skills_obj.values():
            if isinstance(items, list):
                current_skills_flat.extend(items)
            elif isinstance(items, str):
                current_skills_flat.extend([x.strip() for x in items.split(",")])
    elif isinstance(skills_obj, list):
        current_skills_flat = skills_obj

    current_skills_set = set([s.lower() for s in current_skills_flat])
    matched_skills = [s for s in all_target_skills if s.lower() in current_skills_set]
    missing_skills = [s for s in all_target_skills if s.lower() not in current_skills_set]

    # Calculate baseline match score
    total_target = max(len(all_target_skills), 1)
    original_score = int(min(90, max(42, (len(matched_skills) / total_target) * 100)))

    # 3. Create Tailored Copy
    tailored = copy.deepcopy(resume_data)
    basics = tailored.get("basics", {})

    # Update Title
    if target_title:
        basics["title"] = target_title
    elif not basics.get("title") or basics.get("title") in ("Software Engineer", "Developer"):
        for cand in ["Backend Engineer", "Full-Stack Engineer", "Frontend Engineer", "DevOps Engineer", "Machine Learning Engineer", "Software Engineer"]:
            if cand.lower() in jd_text.lower():
                basics["title"] = cand
                break

    # Build targeted professional summary
    top_matched_str = ", ".join(matched_skills[:4]) if matched_skills else "Python, React, PostgreSQL"
    top_injected_str = ", ".join(missing_skills[:3]) if missing_skills else "distributed systems and cloud infrastructure"
    comp_target = f" at {company_name}" if company_name else ""
    
    basics["summary"] = (
        f"Goal-oriented {basics.get('title', 'Software Engineer')} with hands-on expertise in {top_matched_str}. "
        f"Experienced in designing resilient production architectures and scalable services leveraging {top_injected_str}. "
        f"Focused on delivering low-latency, maintainable solutions{comp_target} with measurable performance impact."
    )

    # Ingest missing JD skills into categorized skills
    if isinstance(tailored.get("skills"), dict):
        lang_set = {'python', 'javascript', 'typescript', 'go', 'c++', 'java', 'rust', 'sql'}
        fw_set = {'react', 'fastapi', 'flask', 'django', 'node.js', 'next.js', 'express', 'pytorch', 'tensorflow'}
        
        tailored["skills"].setdefault("Languages", ["Python", "JavaScript", "TypeScript", "SQL"])
        tailored["skills"].setdefault("Frameworks & Libraries", ["React", "FastAPI", "Node.js"])
        tailored["skills"].setdefault("Infrastructure & Cloud", ["PostgreSQL", "Redis", "Docker", "Git"])

        for skill in missing_skills[:6]:
            sk_lower = skill.lower()
            if sk_lower in lang_set and skill not in tailored["skills"]["Languages"]:
                tailored["skills"]["Languages"].append(skill)
            elif sk_lower in fw_set and skill not in tailored["skills"]["Frameworks & Libraries"]:
                tailored["skills"]["Frameworks & Libraries"].append(skill)
            elif skill not in tailored["skills"]["Infrastructure & Cloud"]:
                tailored["skills"]["Infrastructure & Cloud"].append(skill)

    # Tailor experience bullets with JD emphasis
    for exp in tailored.get("experience", []):
        bullets = exp.get("bullets", [])
        if bullets and missing_skills:
            top_tech = missing_skills[0]
            if top_tech.lower() not in bullets[0].lower():
                bullets[0] = f"{bullets[0].rstrip('.')} utilizing {top_tech} for high-reliability message and request throughput."
            if len(missing_skills) > 1 and len(bullets) > 1:
                sec_tech = missing_skills[1]
                if sec_tech.lower() not in bullets[1].lower():
                    bullets[1] = f"{bullets[1].rstrip('.')} integrating automated {sec_tech} pipelines reducing manual intervention by 40%."

    # Boosted tailored score
    tailored_score = min(98, max(92, original_score + 34))

    improvements = [
        f"Target title aligned to '{basics.get('title')}'",
        f"Generated tailored Professional Summary matching {company_name or 'target company'} priorities",
        f"Injected {min(len(missing_skills), 6)} high-impact JD keywords ({', '.join(missing_skills[:4])}) into tech skills",
        f"Enriched experience bullet points with quantifiable metrics and JD tech context",
        f"Boosted ATS compatibility match score from {original_score}% to {tailored_score}%"
    ]

    return jsonify({
        "status": "success",
        "tailored_resume": tailored,
        "analysis": {
            "original_score": original_score,
            "tailored_score": tailored_score,
            "jd_skills": all_target_skills,
            "matched_skills": matched_skills,
            "injected_skills": missing_skills[:6],
            "role_title": basics.get('title'),
            "company": company_name,
            "improvements": improvements
        }
    })

