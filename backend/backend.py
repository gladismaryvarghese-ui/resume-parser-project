from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from supabase import create_client, Client
import spacy
import re
import io
from werkzeug.utils import secure_filename
import PyPDF2
from docx import Document

app = Flask(__name__)
CORS(app)

# Supabase connection
SUPABASE_URL = "https://zpekfqaxzogbitavotzt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZWtmcWF4em9nYml0YXZvdHp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc5Mzg5NSwiZXhwIjoyMDgzMzY5ODk1fQ.oldtB8_dkxBZPQzLK1e9PECmo5r53dQlqoonpjDChBs"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load NLP model
nlp = spacy.load("en_core_web_sm")

# ==================== HELPER FUNCTIONS ====================

def extract_text_from_pdf(file_stream):
    """Extract text from PDF"""
    try:
        reader = PyPDF2.PdfReader(file_stream)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"

def extract_text_from_docx(file_stream):
    """Extract text from DOCX"""
    try:
        doc = Document(file_stream)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except Exception as e:
        return f"Error reading DOCX: {str(e)}"

def extract_text_from_txt(file_stream):
    """Extract text from TXT"""
    try:
        text = file_stream.read().decode('utf-8')
        return text
    except Exception as e:
        return f"Error reading TXT: {str(e)}"

def extract_email(text):
    """Extract email from text"""
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, text)
    return emails[0] if emails else None

def extract_phone(text):
    """Extract phone number"""
    phone_pattern = r'[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}'
    phones = re.findall(phone_pattern, text)
    return phones[0] if phones else None

def extract_name(text):
    """Extract name from first line or using NLP"""
    lines = text.split('\n')
    first_line = lines[0].strip() if lines else ""
    
    # Try first non-empty line (usually name)
    if first_line and len(first_line.split()) <= 5:
        return first_line
    
    # Fallback to NLP
    doc = nlp(text[:500])
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text
    
    return None

def extract_skills(text, common_skills=None):
    """Extract skills from text"""
    if common_skills is None:
        common_skills = [
            "python", "java", "javascript", "typescript", "react", "angular", "vue",
            "node", "express", "django", "flask", "sql", "mongodb", "postgresql",
            "aws", "azure", "gcp", "docker", "kubernetes", "git", "linux",
            "html", "css", "scss", "bootstrap", "tailwind", "webpack", "babel",
            "rest", "graphql", "api", "microservices", "agile", "scrum", "jira",
            "jenkins", "ci/cd", "devops", "machine learning", "tensorflow", "pytorch",
            "pandas", "numpy", "scikit-learn", "nlp", "computer vision", "excel",
            "power bi", "tableau", "salesforce", "sap", "oracle", "hadoop", "spark"
        ]
    
    text_lower = text.lower()
    skills_found = []
    for skill in common_skills:
        if skill in text_lower:
            skills_found.append(skill)
    
    return list(set(skills_found))

def extract_experience(text):
    """Extract years of experience"""
    experience_pattern = r'(\d+)\+?\s*(?:years?|yrs|yoe)'
    matches = re.findall(experience_pattern, text.lower())
    return int(matches[0]) if matches else None

def extract_education(text):
    """Extract education details"""
    qualifications = []
    education_keywords = [
        "bachelor", "master", "phd", "diploma", "b.tech", "m.tech", "b.a", "m.a",
        "bsc", "msc", "be", "me", "ca", "cfa", "aws certified", "kubernetes", "scrum"
    ]
    
    text_lower = text.lower()
    for edu in education_keywords:
        if edu in text_lower:
            qualifications.append(edu.title())
    
    return list(set(qualifications))

def extract_keywords(text):
    """Extract keywords using spaCy"""
    doc = nlp(text)
    keywords = [token.lemma_.lower() for token in doc if not token.is_stop and token.is_alpha and len(token.text) > 3]
    return sorted(list(dict.fromkeys(keywords)))

def parse_resume(text):
    """Parse resume and extract structured data"""
    return {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "skills": extract_skills(text),
        "experience": extract_experience(text),
        "education": extract_education(text),
        "keywords": extract_keywords(text)
    }

# ==================== ROUTES ====================

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Resume Parser Backend is running!"})

@app.route("/upload_resume_file", methods=["POST"])
def upload_resume_file():
    """Upload and parse resume from file (PDF, DOCX, or TXT)"""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    filename = secure_filename(file.filename)
    file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    # Extract text based on file type
    text = None
    if file_ext == 'pdf':
        text = extract_text_from_pdf(file.stream)
    elif file_ext in ['docx', 'doc']:
        text = extract_text_from_docx(file.stream)
    elif file_ext in ['txt', 'text']:
        text = extract_text_from_txt(file.stream)
    else:
        return jsonify({"error": f"Unsupported file type: {file_ext}"}), 400
    
    if not text or text.startswith("Error"):
        return jsonify({"error": text or "Could not extract text from file"}), 400
    
    # Parse the resume
    parsed_data = parse_resume(text)
    
    return jsonify({
        "message": "Resume parsed successfully",
        "filename": filename,
        "data": parsed_data
    })

@app.route("/parse_resume", methods=["POST"])
def parse_resume_endpoint():
    """Parse resume text and match against job description"""
    data = request.json or {}
    resume_text = data.get("resume", "")
    job_description = data.get("job_description", "")
    
    if not resume_text:
        return jsonify({"error": "Resume text required"}), 400
    
    # Parse resume
    parsed_resume = parse_resume(resume_text)
    resume_keywords = parsed_resume["keywords"]
    resume_skills = parsed_resume["skills"]
    
    # Extract job keywords and skills
    job_keywords = extract_keywords(job_description)
    job_skills = extract_skills(job_description)
    
    # Compute matching
    resume_set = set(resume_keywords)
    job_set = set(job_keywords)
    
    if len(job_keywords) == 0:
        accuracy = 0.0
    else:
        matched = job_set.intersection(resume_set)
        accuracy = round((len(matched) / len(job_keywords)) * 100, 2)
    
    # Skill matching
    resume_skills_set = set(resume_skills)
    job_skills_set = set(job_skills)
    matched_skills = resume_skills_set.intersection(job_skills_set)
    missing_skills = job_skills_set.difference(resume_skills_set)
    
    if len(job_skills_set) == 0:
        skill_match_percent = 0.0
    else:
        skill_match_percent = round((len(matched_skills) / len(job_skills_set)) * 100, 2)
    
    # Generate feedback
    feedback = {
        "overall": f"Your resume has a {accuracy}% keyword match with the job description.",
        "skills": f"You have {len(matched_skills)} out of {len(job_skills_set)} required skills ({skill_match_percent}% match).",
        "strengths": f"Strong in: {', '.join(list(matched_skills)[:5]) if matched_skills else 'No matching skills found'}",
        "improvements": f"Consider developing: {', '.join(list(missing_skills)[:5]) if missing_skills else 'You have all required skills!'}"
    }
    
    result = {
        "parsed_resume": parsed_resume,
        "job_keywords": job_keywords,
        "matched_keywords": sorted(list(job_set.intersection(resume_set))),
        "missing_keywords": sorted(list(job_set.difference(resume_set))),
        "accuracy_percent": accuracy,
        "job_skills": job_skills,
        "matched_skills": sorted(list(matched_skills)),
        "missing_skills": sorted(list(missing_skills)),
        "skill_match_percent": skill_match_percent,
        "feedback": feedback
    }
    
    return jsonify(result)

@app.route("/seed", methods=["POST", "GET"])
def seed_db():
    """Seed database with sample data"""
    job_texts = [
        "Senior Python Developer with experience in Django and Flask",
        "Frontend Engineer skilled in React, TypeScript, and CSS",
        "Data Scientist familiar with pandas, scikit-learn, and deep learning",
        "DevOps Engineer experienced with Docker, Kubernetes, and CI/CD",
        "Product Manager with B2B SaaS experience and stakeholder management",
    ]
    
    job_records = []
    for text in job_texts:
        doc = nlp(text)
        keywords = [token.lemma_ for token in doc if not token.is_stop]
        job_records.append({"description": text, "keywords": keywords})
    
    try:
        job_resp = supabase.table("job_descriptions").insert(job_records).execute()
        return jsonify({"message": "Seed completed", "jobs_inserted": len(job_records)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
