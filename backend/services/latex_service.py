"""
services/latex_service.py
-------------------------
Production LaTeX Resume Generation Engine.
Supports:
  - Jake's Resume (FAANG Single-Column Gold Standard)
  - Modern Tech (Color accents, modern headers)
  - Academic / Deedy Style (Research, high-density)
  - Minimalist Classic
"""
import re
import os
import subprocess
import tempfile
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def escape_latex(val: Any) -> str:
    """Escapes all LaTeX special characters in user input to prevent compile errors or injection."""
    if val is None:
        return ""
    text = str(val)
    # Special character mapping
    replacements = [
        ('\\', r'\textbackslash{}'),
        ('&', r'\&'),
        ('%', r'\%'),
        ('$', r'\$'),
        ('#', r'\#'),
        ('_', r'\_'),
        ('{', r'\{'),
        ('}', r'\}'),
        ('~', r'\textasciitilde{}'),
        ('^', r'\textasciicircum{}'),
    ]
    for orig, rep in replacements:
        text = text.replace(orig, rep)
    return text

def sanitize_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively escape all string values in the resume data dictionary."""
    sanitized = {}
    for k, v in data.items():
        if isinstance(v, str):
            sanitized[k] = escape_latex(v)
        elif isinstance(v, list):
            sanitized[k] = [
                sanitize_data(item) if isinstance(item, dict)
                else (escape_latex(item) if isinstance(item, str) else item)
                for item in v
            ]
        elif isinstance(v, dict):
            sanitized[k] = sanitize_data(v)
        else:
            sanitized[k] = v
    return sanitized

# ─────────────────────────────────────────────────────────────────
# Template 1: Jake's Resume (Single-Column ATS Gold Standard)
# ─────────────────────────────────────────────────────────────────

def render_jakes_resume(data: Dict[str, Any]) -> str:
    d = sanitize_data(data)
    basics = d.get("basics", {})
    education = d.get("education", [])
    experience = d.get("experience", [])
    projects = d.get("projects", [])
    skills = d.get("skills", {})

    # Contact line components
    contacts = []
    if basics.get("phone"):
        contacts.append(basics['phone'])
    if basics.get("email"):
        contacts.append(r"\href{mailto:" + basics['email'] + r"}{\underline{" + basics['email'] + r"}}")
    if basics.get("linkedin"):
        clean_li = basics['linkedin'].replace("https://", "").replace("http://", "")
        contacts.append(r"\href{https://" + clean_li + r"}{\underline{" + clean_li + r"}}")
    if basics.get("github"):
        clean_gh = basics['github'].replace("https://", "").replace("http://", "")
        contacts.append(r"\href{https://" + clean_gh + r"}{\underline{" + clean_gh + r"}}")
    if basics.get("portfolio"):
        clean_p = basics['portfolio'].replace("https://", "").replace("http://", "")
        contacts.append(r"\href{https://" + clean_p + r"}{\underline{" + clean_p + r"}}")

    contact_str = " $|$ ".join(contacts)

    # Education block
    edu_tex = []
    for edu in education:
        inst = edu.get("institution", "")
        loc = edu.get("location", "")
        deg = edu.get("degree", "")
        dates = f"{edu.get('start', '')} -- {edu.get('end', '')}".strip(" -")
        score = edu.get("score", "")
        score_line = f" \\textit{{\\small {score}}}" if score else ""
        edu_tex.append(f"""
    \\resumeSubheading
      {{{inst}}}{{{loc}}}
      {{{deg}{score_line}}}{{{dates}}}""")

    # Experience block
    exp_tex = []
    for exp in experience:
        role = exp.get("role", "")
        comp = exp.get("company", "")
        loc = exp.get("location", "")
        dates = f"{exp.get('start', '')} -- {exp.get('end', '')}".strip(" -")
        bullets = exp.get("bullets", [])
        bullet_items = "\n".join([f"        \\resumeItem{{{b}}}" for b in bullets if b.strip()])
        exp_tex.append(f"""
    \\resumeSubheading
      {{{role}}}{{{dates}}}
      {{{comp}}}{{{loc}}}
      \\resumeItemListStart
{bullet_items}
      \\resumeItemListEnd""")

    # Projects block
    proj_tex = []
    for proj in projects:
        name = proj.get("name", "")
        tech = proj.get("tech", "")
        link = proj.get("link", "")
        link_str = f" $|$ \\href{{{link}}}{{\\underline{{Source / Live}}}}" if link else ""
        bullets = proj.get("bullets", [])
        bullet_items = "\n".join([f"        \\resumeItem{{{b}}}" for b in bullets if b.strip()])
        proj_tex.append(f"""
    \\resumeProjectHeading
      {{\\textbf{{{name}}} $|$ \\emph{{{tech}}}{link_str}}}{{}}
      \\resumeItemListStart
{bullet_items}
      \\resumeItemListEnd""")

    # Skills block
    skills_tex = []
    if isinstance(skills, dict):
        for cat, items in skills.items():
            if isinstance(items, list):
                item_str = ", ".join(items)
            else:
                item_str = str(items)
            skills_tex.append(f"     \\textbf{{{cat}}}{{: {item_str}}} \\\\")
    elif isinstance(skills, list):
        skills_tex.append(f"     \\textbf{{Skills}}{{: {', '.join(skills)}}} \\\\")

    cand_name = basics.get('name', 'Developer Name')
    has_photo = bool(basics.get("photo")) and bool(basics.get("showPhoto", True))
    if has_photo:
        header_block = f"""%----------HEADING WITH PHOTO----------
\\noindent
\\begin{{minipage}}[c]{{0.78\\textwidth}}
    \\textbf{{\\Huge \\scshape {cand_name}}} \\\\ \\vspace{{1pt}}
    \\small {contact_str}
\\end{{minipage}}%
\\hfill
\\begin{{minipage}}[c]{{0.20\\textwidth}}
    \\raggedleft
    % Place photo.jpg in Overleaf project root
    \\includegraphics[width=2.2cm,height=2.5cm,keepaspectratio]{{photo.jpg}}
\\end{{minipage}}
\\vspace{{3pt}}"""
    else:
        header_block = f"""%----------HEADING----------
\\begin{{center}}
    \\textbf{{\\Huge \\scshape {cand_name}}} \\\\ \\vspace{{1pt}}
    \\small {contact_str}
\\end{{center}}"""

    return f"""%-------------------------
% Resume in LaTeX - Jake's Resume Standard (ATS Optimized)
% Generated by JobOrbit Resume Studio
%------------------------

\\documentclass[letterpaper,11pt]{{article}}

\\usepackage{{latexsym}}
\\usepackage[empty]{{fullpage}}
\\usepackage{{titlesec}}
\\usepackage{{marvosym}}
\\usepackage[usenames,dvipsnames]{{color}}
\\usepackage{{verbatim}}
\\usepackage{{enumitem}}
\\usepackage[hidelinks]{{hyperref}}
\\usepackage{{fancyhdr}}
\\usepackage[english]{{babel}}
\\usepackage{{tabularx}}
\\usepackage{{graphicx}}
\\input{{glyphtounicode}}

\\pagestyle{{fancy}}
\\fancyhf{{}}
\\fancyfoot{{}}
\\renewcommand{{\\headrulewidth}}{{0pt}}
\\renewcommand{{\\footrulewidth}}{{0pt}}

% Adjust margins
\\addtolength{{\\oddsidemargin}}{{-0.5in}}
\\addtolength{{\\evensidemargin}}{{-0.5in}}
\\addtolength{{\\textwidth}}{{1in}}
\\addtolength{{\\topmargin}}{{-0.5in}}
\\addtolength{{\\textheight}}{{1.0in}}

\\urlstyle{{same}}
\\raggedbottom
\\raggedright
\\setlength{{\\tabcolsep}}{{0in}}

% Sections formatting
\\titleformat{{\\section}}{{
  \\vspace{{-4pt}}\\scshape\\raggedright\\large
}}{{}}{{0em}}{{}}[\\color{{black}}\\titlerule \\vspace{{-5pt}}]

% Ensure that generate pdf is machine readable/ATS parsable
\\pdfgentounicode=1

% Custom commands
\\newcommand{{\\resumeItem}}[1]{{
  \\item\\small{{
    {{#1 \\vspace{{-2pt}}}}
  }}
}}

\\newcommand{{\\resumeSubheading}}[4]{{
  \\vspace{{-2pt}}\\item
    \\begin{{tabular*}}{{0.97\\textwidth}}[t]{{l@{{\\extracolsep{{\\fill}}}}r}}
      \\textbf{{#1}} & #2 \\\\
      \\textit{{\\small#3}} & \\textit{{\\small #4}} \\\\
    \\end{{tabular*}}\\vspace{{-7pt}}
}}

\\newcommand{{\\resumeProjectHeading}}[2]{{
    \\item
    \\begin{{tabular*}}{{0.97\\textwidth}}{{l@{{\\extracolsep{{\\fill}}}}r}}
      \\small#1 & #2 \\\\
    \\end{{tabular*}}\\vspace{{-7pt}}
}}

\\newcommand{{\\resumeSubItem}}[1]{{\\resumeItem{{#1}}\\vspace{{-4pt}}}}
\\renewcommand\\labelitemii{{$\\vcenter{{\\hbox{{\\tiny$\\bullet$}}}}$}}
\\newcommand{{\\resumeSubHeadingListStart}}{{\\begin{{itemize}}[leftmargin=0.15in, label={{}}]}}
\\newcommand{{\\resumeSubHeadingListEnd}}{{\\end{{itemize}}}}
\\newcommand{{\\resumeItemListStart}}{{\\begin{{itemize}}}}
\\newcommand{{\\resumeItemListEnd}}{{\\end{{itemize}}\\vspace{{-5pt}}}}

\\begin{{document}}

{header_block}

%-----------SUMMARY-----------
{"\\section{Professional Summary}\\small " + basics.get('summary', '') + "\\vspace{-2pt}" if basics.get('summary') else ""}

%-----------EDUCATION-----------
\\section{{Education}}
  \\resumeSubHeadingListStart
{''.join(edu_tex)}
  \\resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\\section{{Experience}}
  \\resumeSubHeadingListStart
{''.join(exp_tex)}
  \\resumeSubHeadingListEnd

%-----------PROJECTS-----------
\\section{{Projects}}
  \\resumeSubHeadingListStart
{''.join(proj_tex)}
  \\resumeSubHeadingListEnd

%-----------TECHNICAL SKILLS-----------
\\section{{Technical Skills}}
 \\begin{{itemize}}[leftmargin=0.15in, label={{}}]
    \\small{{\\item{{
{''.join(skills_tex)}
    }}}}
 \\end{{itemize}}

\\end{{document}}
"""

# ─────────────────────────────────────────────────────────────────
# Template 2: Modern Tech (Color Accents & Sans-Serif)
# ─────────────────────────────────────────────────────────────────

def render_modern_tech(data: Dict[str, Any]) -> str:
    d = sanitize_data(data)
    basics = d.get("basics", {})
    education = d.get("education", [])
    experience = d.get("experience", [])
    projects = d.get("projects", [])
    skills = d.get("skills", {})

    contacts = []
    if basics.get("phone"): contacts.append(basics['phone'])
    if basics.get("email"): contacts.append(r"\href{mailto:" + basics['email'] + r"}{" + basics['email'] + r"}")
    if basics.get("linkedin"): contacts.append(r"\href{https://" + basics['linkedin'].replace("https://", "") + r"}{LinkedIn}")
    if basics.get("github"): contacts.append(r"\href{https://" + basics['github'].replace("https://", "") + r"}{GitHub}")
    if basics.get("portfolio"): contacts.append(r"\href{https://" + basics['portfolio'].replace("https://", "") + r"}{Portfolio}")

    edu_items = []
    for edu in education:
        edu_items.append(f"""
\\textbf{{{edu.get('institution', '')}}} \\hfill {edu.get('start', '')} -- {edu.get('end', '')} \\\\
\\textsl{{{edu.get('degree', '')}}} \\hfill {edu.get('location', '')} {f' -- {edu.get("score")}' if edu.get('score') else ''}
\\vspace{{3pt}}
""")

    exp_items = []
    for exp in experience:
        bullets = "\n".join([f"  \\item {b}" for b in exp.get("bullets", []) if b.strip()])
        exp_items.append(f"""
\\textbf{{{exp.get('role', '')}}} \\hfill \\textbf{{{exp.get('company', '')}}} \\\\
\\textsl{{{exp.get('location', '')}}} \\hfill \\textsl{{{exp.get('start', '')} -- {exp.get('end', '')}}}
\\begin{{itemize}}[leftmargin=12pt, topsep=2pt, itemsep=1pt]
{bullets}
\\end{{itemize}}
\\vspace{{4pt}}
""")

    proj_items = []
    for proj in projects:
        bullets = "\n".join([f"  \\item {b}" for b in proj.get("bullets", []) if b.strip()])
        p_link = proj.get("link", "")
        link_str = f"\\href{{{p_link}}}{{\\small [Link]}}" if p_link else ""
        proj_items.append(f"""
\\textbf{{{proj.get('name', '')}}} $|$ \\textsl{{{proj.get('tech', '')}}} \\hfill {link_str}
\\begin{{itemize}}[leftmargin=12pt, topsep=2pt, itemsep=1pt]
{bullets}
\\end{{itemize}}
\\vspace{{4pt}}
""")

    skill_items = []
    if isinstance(skills, dict):
        for k, v in skills.items():
            vals = ", ".join(v) if isinstance(v, list) else str(v)
            skill_items.append(f"\\textbf{{{k}:}} {vals} \\\\")

    cand_name = basics.get('name', 'Developer Name')
    cand_title = basics.get('title', 'Software Engineer')
    has_photo = bool(basics.get("photo")) and bool(basics.get("showPhoto", True))
    if has_photo:
        modern_header_block = f"""% Header with Photo
\\noindent
\\begin{{minipage}}[c]{{0.78\\textwidth}}
  {{\\Huge\\bfseries\\color{{darkgray}} {cand_name}}} \\\\
  \\vspace{{2pt}}
  {{\\color{{primary}}\\bfseries {cand_title}}} \\\\
  \\vspace{{3pt}}
  {{\\small { " $|$ ".join(contacts) }}}
\\end{{minipage}}%
\\hfill
\\begin{{minipage}}[c]{{0.20\\textwidth}}
  \\raggedleft
  % Place photo.jpg in Overleaf root folder
  \\includegraphics[width=2.2cm,height=2.5cm,keepaspectratio]{{photo.jpg}}
\\end{{minipage}}
\\vspace{{6pt}}"""
    else:
        modern_header_block = f"""% Header
\\begin{{center}}
  {{\\Huge\\bfseries\\color{{darkgray}} {cand_name}}} \\\\
  \\vspace{{3pt}}
  {{\\color{{primary}}\\bfseries {cand_title}}} \\\\
  \\vspace{{4pt}}
  {{\\small { " $|$ ".join(contacts) }}}
\\end{{center}}"""

    return f"""% Modern Tech Resume - Generated by JobOrbit Studio
\\documentclass[10pt, a4paper]{{article}}
\\usepackage[margin=0.6in]{{geometry}}
\\usepackage{{hyperref}}
\\usepackage{{xcolor}}
\\usepackage{{enumitem}}
\\usepackage{{titlesec}}
\\usepackage{{parskip}}
\\usepackage{{graphicx}}

\\definecolor{{primary}}{{RGB}}{{37, 99, 235}} % Electric Blue
\\definecolor{{darkgray}}{{RGB}}{{55, 65, 81}}

\\hypersetup{{colorlinks=true, linkcolor=primary, urlcolor=primary}}

\\titleformat{{\\section}}{{\\color{{primary}}\\large\\bfseries\\uppercase}}{{}}{{0em}}{{}}[\\color{{primary}}\\titlerule]
\\titlespacing*{{\\section}}{{0pt}}{{8pt}}{{6pt}}

\\begin{{document}}
\\pagestyle{{empty}}

{modern_header_block}

\\vspace{{2pt}}
{"\\section{Summary}\\small " + basics.get('summary', '') + "\\vspace{4pt}" if basics.get('summary') else ""}

\\section{{Technical Skills}}
\\small
{''.join(skill_items)}

\\section{{Work Experience}}
{''.join(exp_items)}

\\section{{Projects}}
{''.join(proj_items)}

\\section{{Education}}
{''.join(edu_items)}

\\end{{document}}
"""


# ─────────────────────────────────────────────────────────────────
# Template 3: Charter Serif Executive Engineer (ATS Standard)
# ─────────────────────────────────────────────────────────────────

def render_charter_agent(data: Dict[str, Any]) -> str:
    d = sanitize_data(data)
    basics = d.get("basics", {})
    education = d.get("education", [])
    experience = d.get("experience", [])
    projects = d.get("projects", [])
    skills = d.get("skills", {})
    publications = d.get("publications", [])

    cand_name = basics.get('name', 'Alex Chen')

    # Contact line
    contacts = []
    if basics.get("portfolio"):
        clean_p = basics['portfolio'].replace("https://", "").replace("http://", "").rstrip('/')
        contacts.append(r"\href{https://" + clean_p + r"/}{" + clean_p + r"}")
    if basics.get("phone"):
        contacts.append(basics['phone'])
    if basics.get("email"):
        contacts.append(r"\href{mailto:" + basics['email'] + r"}{" + basics['email'] + r"}")
    if basics.get("linkedin"):
        clean_li = basics['linkedin'].replace("https://", "").replace("http://", "").rstrip('/')
        contacts.append(r"\href{https://" + clean_li + r"}{" + clean_li + r"}")
    if basics.get("github"):
        clean_gh = basics['github'].replace("https://", "").replace("http://", "").rstrip('/')
        contacts.append(r"\href{https://" + clean_gh + r"}{" + clean_gh + r"}")

    contact_str = r" \hspace{0.5em}\textbar\hspace{0.5em} ".join(contacts)

    # Education block
    edu_blocks = []
    for edu in education:
        inst = edu.get("institution", "")
        loc = edu.get("location", "India")
        deg = edu.get("degree", "")
        dates = f"{edu.get('start', '')} -- {edu.get('end', '')}".strip(" -")
        score = edu.get("score", "")
        loc_str = f", {loc}" if loc else ""
        score_item = f"\\item {deg}\n    \\hfill\n    \\textbf{{{score}}}" if score else f"\\item {deg}"
        edu_blocks.append(f"""\\textbf{{{inst}}}{loc_str}
\\hfill
\\textbf{{{dates}}}

\\begin{{highlights}}
    {score_item}
\\end{{highlights}}""")

    # Experience block
    exp_blocks = []
    for exp in experience:
        comp = exp.get("company", "")
        loc = exp.get("location", "")
        role = exp.get("role", "")
        dates = f"{exp.get('start', '')} -- {exp.get('end', '')}".strip(" -")
        bullets = exp.get("bullets", [])
        bullet_items = "\n    \\item ".join([b for b in bullets if b.strip()])
        loc_str = f", {loc}" if loc else ""
        exp_blocks.append(f"""\\textbf{{{comp}}}{loc_str}
\\hfill
\\textbf{{{dates}}} \\\\
\\textit{{{role}}}

\\begin{{highlights}}
    \\item {bullet_items}
\\end{{highlights}}
\\vspace{{4pt}}""")

    # Projects block
    proj_blocks = []
    for proj in projects:
        name = proj.get("name", "")
        tech = proj.get("tech", "")
        link = proj.get("link", "")
        bullets = proj.get("bullets", [])
        bullet_items = "\n    \\item ".join([b for b in bullets if b.strip()])
        link_str = f"\\hfill\n\\href{{{link}}}{{GitHub Repository}}" if link else ""
        tech_str = f"\\textbf{{Tech:}} {tech}\n\n\\vspace{{4pt}}" if tech else "\\vspace{{4pt}}"
        proj_blocks.append(f"""\\textbf{{{name}}}
{link_str}

\\begin{{highlights}}
    \\item {bullet_items}
\\end{{highlights}}

{tech_str}""")

    # Skills block
    skill_lines = []
    if isinstance(skills, dict):
        for cat, items in skills.items():
            if isinstance(items, list):
                item_str = ", ".join(items)
            else:
                item_str = str(items)
            skill_lines.append(f"\\textbf{{{cat}:}} {item_str}\n\n\\vspace{{1pt}}")
    elif isinstance(skills, list):
        skill_lines.append(f"\\textbf{{Technical Skills:}} {', '.join(skills)}\n\n\\vspace{{1pt}}")

    # Publications & Achievements
    pub_block = ""
    pub_items = []
    if publications:
        for p in publications:
            pub_items.append(f"\\item {p}")
    else:
        pub_items = [
            r"\item \textbf{Publication:} ``Investigating Data Leakage--Induced Over-Confidence and Explanation Faithfulness in Transformer-Based Text and Audio Models'' -- \textit{Iconic Research and Engineering Journals (IRE Journals)}.",
            r"\item Secured a rank among the \textbf{top 2 out of 1000+} participants in the COS-DATA India Hackathon."
        ]
    
    pub_block = f"""% =========================================================
% PUBLICATIONS & ACHIEVEMENTS
% =========================================================

\\section{{Publications \\& Achievements}}

\\vspace{{2pt}}

\\begin{{highlights}}
    {'\n\n    '.join(pub_items)}
\\end{{highlights}}
"""

    summary_text = basics.get("summary", "Driven engineer with expertise in building agentic frameworks, backend systems and design")

    return f"""\\documentclass[11pt, letterpaper]{{article}}

% --- Packages ---
\\usepackage[
    top=1.8cm,
    bottom=1.8cm,
    left=1.8cm,
    right=1.8cm,
    footskip=0.8cm
]{{geometry}}

\\usepackage{{titlesec}}
\\usepackage{{enumitem}}
\\usepackage[
    pdftitle={{{cand_name} - Resume}},
    pdfauthor={{{cand_name}}},
    colorlinks=true,
    urlcolor=black
]{{hyperref}}
\\usepackage{{charter}}

% --- Page Setup ---
\\raggedright
\\pagestyle{{empty}}
\\setcounter{{secnumdepth}}{{0}}
\\setlength{{\\parindent}}{{0pt}}
\\setlength{{\\parskip}}{{0pt}}

% --- Section Formatting ---
\\titleformat{{\\section}}
    {{\\bfseries\\large}}
    {{}}
    {{0pt}}
    {{}}
    [\\vspace{{-2pt}}\\titlerule]

\\titlespacing{{\\section}}
    {{-1pt}}
    {{0.10cm}}
    {{0.05cm}}

\\renewcommand\\labelitemi{{$\\vcenter{{\\hbox{{\\small$\\bullet$}}}}$}}

% --- Custom List Environment ---
\\newenvironment{{highlights}}{{
    \\begin{{itemize}}[
        topsep=0pt,
        parsep=0pt,
        partopsep=0pt,
        itemsep=1pt,
        leftmargin=12pt
    ]
}}{{
    \\end{{itemize}}
}}

\\begin{{document}}

% =========================================================
% HEADER
% =========================================================

\\begin{{center}}
    {{\\fontsize{{22pt}}{{22pt}}\\selectfont \\textbf{{{cand_name}}}}}
\\end{{center}}

\\vspace{{-10pt}}

\\begin{{center}}
    \\footnotesize
    {contact_str}
\\end{{center}}

\\vspace{{-10pt}}

% =========================================================
% CAREER OBJECTIVE
% =========================================================

\\section{{Career Objective}}

{summary_text}

\\vspace{{2pt}}

% =========================================================
% EDUCATION
% =========================================================

\\section{{Education}}

\\vspace{{2pt}}

{chr(10).join(edu_blocks)}

% =========================================================
% EXPERIENCE
% =========================================================

\\section{{Experience}}

\\vspace{{2pt}}

{chr(10).join(exp_blocks)}

% =========================================================
% PROJECTS
% =========================================================

\\section{{Projects}}

\\vspace{{2pt}}

{chr(10).join(proj_blocks)}

% =========================================================
% TECHNICAL SKILLS
% =========================================================

\\section{{Technical Skills}}

\\vspace{{2pt}}

{chr(10).join(skill_lines)}

\\vspace{{2pt}}

{pub_block}

\\end{{document}}
"""

TEMPLATE_REGISTRY = {
    "charter": {
        "id": "charter",
        "name": "Agentic AI / Charter Standard",
        "badge": "★ Gold Standard",
        "tagline": "Charter serif elegance with clean highlights environments, optimized for top AI & Systems engineering roles.",
        "font": "Bitstream Charter",
        "columns": 1,
        "renderer": render_charter_agent,
    },
    "jake": {
        "id": "jake",
        "name": "Jake's Resume (FAANG Classic)",
        "badge": "100% ATS Pass Rate",
        "tagline": "The single-column classic used by engineers landing Google, Amazon & Meta offers.",
        "font": "Computer Modern",
        "columns": 1,
        "renderer": render_jakes_resume,
    },
    "modern_tech": {
        "id": "modern_tech",
        "name": "Modern Tech Pro",
        "badge": "Modern Startup Favorite",
        "tagline": "Sleek headings, electric blue accent lines, and structured technical skill categorization.",
        "font": "Helvetica / Sans",
        "columns": 1,
        "renderer": render_modern_tech,
    },
}

def generate_latex_source(data: Dict[str, Any], template_id: str = "charter") -> str:
    """Generates pure LaTeX source code for the given resume JSON and template."""
    tmpl = TEMPLATE_REGISTRY.get(template_id, TEMPLATE_REGISTRY["charter"])
    return tmpl["renderer"](data)

