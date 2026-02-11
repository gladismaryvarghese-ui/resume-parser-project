from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import re
import PyPDF2
from docx import Document

app = Flask(__name__)
CORS(app)

nlp = spacy.load("en_core_web_sm")

# ================= TEXT EXTRACTION =================

def extract_text_from_pdf(file_stream):
    file_stream.seek(0)
    reader = PyPDF2.PdfReader(file_stream)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text.strip()

def extract_text_from_docx(file_stream):
    file_stream.seek(0)
    doc = Document(file_stream)
    return "\n".join([p.text for p in doc.paragraphs]).strip()

def extract_text_from_txt(file_stream):
    return file_stream.read().decode("utf-8", errors="ignore")

# ================= EXTRACTION HELPERS =================

def extract_email(text):
    match = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    return match[0] if match else None

def extract_phone(text):
    match = re.findall(r'[\+]?\d[\d\s\-]{8,15}', text)
    return match[0] if match else None

def extract_experience(text):
    match = re.findall(r'(\d+)\+?\s*(years?|yrs|yoe)', text.lower())
    return int(match[0][0]) if match else 0

def extract_skills(text):
    common_skills = [
        "python","java","javascript","react","node","django","flask",
        "sql","mongodb","aws","docker","kubernetes","machine learning",
        "tensorflow","pytorch","pandas","numpy","excel"
    ]
    text = text.lower()
    return list(set([skill for skill in common_skills if skill in text]))

def extract_keywords(text):
    doc = nlp(text)
    return list(set([token.lemma_.lower()
                     for token in doc
                     if token.is_alpha and not token.is_stop and len(token.text) > 3]))

def parse_resume(text):
    return {
        "email": extract_email(text),
        "phone": extract_phone(text),
        "skills": extract_skills(text),
        "experience": extract_experience(text),
        "keywords": extract_keywords(text)
    }

# ================= ROUTES =================

@app.route("/")
def home():
    return jsonify({"message": "Backend Running Successfully"})

@app.route("/upload_resume_file", methods=["POST"])
def upload_resume_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(file.stream)
    elif filename.endswith(".docx") or filename.endswith(".doc"):
        text = extract_text_from_docx(file.stream)
    elif filename.endswith(".txt"):
        text = extract_text_from_txt(file.stream)
    else:
        return jsonify({"error": "Unsupported file type"}), 400

    if not text:
        return jsonify({"error": "Could not extract text"}), 400

    parsed = parse_resume(text)

    return jsonify({
        "data": parsed,
        "text": text
    })


@app.route("/parse_resume", methods=["POST"])
def analyze_resume():
    data = request.json
    resume_text = data.get("resume", "")
    job_description = data.get("job_description", "")

    if not resume_text or not job_description:
        return jsonify({"error": "Missing data"}), 400

    parsed = parse_resume(resume_text)

    resume_keywords = set(parsed["keywords"])
    job_keywords = set(extract_keywords(job_description))

    resume_skills = set(parsed["skills"])
    job_skills = set(extract_skills(job_description))

    # Keyword match
    accuracy = round((len(resume_keywords & job_keywords) /
                      len(job_keywords)) * 100, 2) if job_keywords else 0

    # Skill match
    skill_match = round((len(resume_skills & job_skills) /
                         len(job_skills)) * 100, 2) if job_skills else 0

    years = parsed["experience"]

    if years <= 2:
        level = "Junior"
    elif years <= 5:
        level = "Mid"
    else:
        level = "Senior"

    strength_score = round((accuracy * 0.5) + (skill_match * 0.4) + (years * 2), 2)

    eligible = strength_score >= 60 and skill_match >= 50

    summary = resume_text[:300]

    return jsonify({
        "accuracy_percent": accuracy,
        "skill_match_percent": skill_match,
        "strength_score": strength_score,
        "years_experience": years,
        "experience_level": level,
        "core_summary": summary,
        "matched_skills": list(resume_skills & job_skills),
        "missing_skills": list(job_skills - resume_skills),
        "eligible": eligible
    })


if __name__ == "__main__":
    app.run(port=5000, debug=True)
