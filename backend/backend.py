from flask import Flask, request, jsonify
from supabase import create_client, Client
import spacy

app = Flask(__name__)

# Supabase connection
SUPABASE_URL = "https://zpekfqaxzogbitavotzt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZWtmcWF4em9nYml0YXZvdHp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc5Mzg5NSwiZXhwIjoyMDgzMzY5ODk1fQ.oldtB8_dkxBZPQzLK1e9PECmo5r53dQlqoonpjDChBs"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load NLP model
nlp = spacy.load("en_core_web_sm")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Resume Parser Backend is running!"})

@app.route("/add_job", methods=["POST"])
def add_job():
    data = request.json
    job_desc = data.get("description", "")
    doc = nlp(job_desc)
    keywords = [token.lemma_ for token in doc if not token.is_stop]
    supabase.table("job_descriptions").insert({"description": job_desc, "keywords": keywords}).execute()
    return jsonify({"message": "Job description added", "keywords": keywords})

@app.route("/upload_resume", methods=["POST"])
def upload_resume():
    data = request.json
    resume_text = data.get("resume", "")
    doc = nlp(resume_text)
    keywords = [token.lemma_ for token in doc if not token.is_stop]
    # Insert using the actual column name `resume_text`
    supabase.table("resumes").insert({"resume_text": resume_text, "keywords": keywords}).execute()
    return jsonify({"message": "Resume uploaded", "keywords": keywords})


@app.route("/parse_resume", methods=["POST"])
def parse_resume():
    """Accepts JSON: {"resume": "...", "job_description": "..."}
    Returns extracted keywords, matched keywords and an accuracy percentage.
    """
    data = request.json or {}
    resume_text = data.get("resume", "")
    job_description = data.get("job_description", "")

    # Extract keywords via spaCy lemmas (basic)
    def extract_keywords(text):
        d = nlp(text or "")
        return [token.lemma_.lower() for token in d if not token.is_stop and token.is_alpha]

    resume_keywords = list(dict.fromkeys(extract_keywords(resume_text)))
    job_keywords = list(dict.fromkeys(extract_keywords(job_description)))

    # Compute matching: how many job keywords appear in resume keywords (simple set overlap)
    resume_set = set(resume_keywords)
    job_set = set(job_keywords)
    if len(job_keywords) == 0:
        accuracy = 0.0
    else:
        matched = job_set.intersection(resume_set)
        accuracy = round((len(matched) / len(job_keywords)) * 100, 2)

    result = {
        "resume_keywords": resume_keywords,
        "job_keywords": job_keywords,
        "matched_keywords": sorted(list(job_set.intersection(resume_set))),
        "missing_keywords": sorted(list(job_set.difference(resume_set))),
        "accuracy_percent": accuracy,
    }

    # Optionally persist the parsed resume and score
    try:
        supabase.table("resumes").insert({"resume_text": resume_text, "keywords": resume_keywords, "match_score": accuracy}).execute()
    except Exception:
        # insertion shouldn't block the response
        pass

    return jsonify(result)


@app.route("/seed", methods=["POST", "GET"])
def seed_db():
    # Sample job descriptions
    job_texts = [
        "Senior Python Developer with experience in Django and Flask",
        "Frontend Engineer skilled in React, TypeScript, and CSS",
        "Data Scientist familiar with pandas, scikit-learn, and deep learning",
        "DevOps Engineer experienced with Docker, Kubernetes, and CI/CD",
        "Product Manager with B2B SaaS experience and stakeholder management",
        "QA Engineer experienced in automated testing with Selenium and pytest",
        "Mobile Developer experienced in iOS (Swift) and Android (Kotlin)",
        "UX/UI Designer skilled in Figma, user research, and prototyping",
        "Backend Engineer experienced in Node.js, Express and REST APIs",
        "Cloud Architect with AWS, GCP and cost-optimization expertise",
    ]

    # Sample resumes
    resume_texts = [
        "Experienced software developer with strong Python and Flask background",
        "Frontend specialist building responsive React applications",
        "Machine learning engineer working on NLP and computer vision projects",
        "Site reliability engineer focusing on monitoring and incident response",
        "Technical product owner driving roadmap and cross-functional teams",
        "Automation QA with experience writing end-to-end tests",
        "iOS developer with multiple apps published on the App Store",
        "Interaction designer creating high-fidelity prototypes",
        "API developer designing scalable microservices",
        "Cloud engineer migrating workloads to AWS and reducing costs",
    ]

    job_records = []
    for text in job_texts:
        doc = nlp(text)
        keywords = [token.lemma_ for token in doc if not token.is_stop]
        job_records.append({"description": text, "keywords": keywords})

    resume_records = []
    for text in resume_texts:
        doc = nlp(text)
        keywords = [token.lemma_ for token in doc if not token.is_stop]
        resume_records.append({"resume": text, "keywords": keywords})

    # Insert into Supabase
    job_resp = supabase.table("job_descriptions").insert(job_records).execute()
    resume_resp = supabase.table("resumes").insert(resume_records).execute()

    return jsonify({
        "message": "Seed completed",
        "jobs_inserted": len(job_records),
        "resumes_inserted": len(resume_records),
        "job_response": getattr(job_resp, 'data', str(job_resp)),
        "resume_response": getattr(resume_resp, 'data', str(resume_resp)),
    })

@app.route("/inspect", methods=["GET"])
def inspect_tables():
    # Return a single row (if any) from each table to reveal column names
    job_q = supabase.table("job_descriptions").select("*").limit(1).execute()
    resume_q = supabase.table("resumes").select("*").limit(1).execute()
    return jsonify({
        "job_data": getattr(job_q, 'data', str(job_q)),
        "resume_data": getattr(resume_q, 'data', str(resume_q)),
    })

if __name__ == "__main__":
    app.run(debug=True)