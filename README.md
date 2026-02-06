# Resume Parser

A full-stack web app for parsing resumes and scoring their match against job descriptions.

## Features

- **User Authentication**: Sign up/sign in with email using Supabase Auth. Session persists until sign out.
- **Resume Parsing**: Extract keywords from resumes using NLP (spaCy).
- **Job Matching**: Compare resume keywords to job description keywords and get a percentage accuracy score.
- **Database**: Supabase PostgreSQL for users, resumes, and job descriptions.

## Tech Stack

- **Frontend**: Next.js (React), Supabase Auth
- **Backend**: Flask, spaCy NLP
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (frontend), Render/Railway (backend)

## Local Development

### Backend

1. Install Python dependencies:
```bash
cd backend
python -m pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

2. Run:
```bash
python backend.py
```
Backend will be at: `http://127.0.0.1:5000`

### Frontend

1. Install Node dependencies:
```bash
cd frontend
npm install
```

2. Run dev server:
```bash
npm run dev
```
Frontend will be at: `http://localhost:3000`

## Deployment

### Step 1: Deploy Frontend on Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. Click "Add New" → "Project".
3. Import this GitHub repo (`gladismaryvarghese-ui/resume-parser-project`).
4. Set framework preset to **Next.js**.
5. In "Root Directory", type `frontend`.
6. Click Deploy and wait for the frontend URL (e.g., `https://resume-parser-abc123.vercel.app`).

### Step 2: Deploy Backend on Render

1. Go to https://render.com and sign in with GitHub.
2. Click "New +" → "Web Service".
3. Connect your repo (`gladismaryvarghese-ui/resume-parser-project`).
4. Configure:
   - **Name**: `resume-parser-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
   - **Start Command**: `gunicorn backend:app`
   - **Instance Type**: Free (or paid)
5. Click "Create Web Service" and wait for the backend URL (e.g., `https://resume-parser-backend.onrender.com`).

### Step 3: Connect Frontend to Backend

1. Go back to Vercel dashboard.
2. Click your frontend project.
3. Go to "Settings" → "Environment Variables".
4. Add environment variable:
   - **Key**: `BACKEND_URL`
   - **Value**: your Render backend URL (e.g., `https://resume-parser-backend.onrender.com`)
5. Click "Save" and redeploy (or push a commit to trigger re-deploy).

**And you're done!** Your app is now live. Frontend auto-deploys on every push to `main`, and backend auto-redeploys on every push.

## API Endpoints

### Backend (Flask)

- `GET /` → Health check
- `POST /parse_resume` → Parse resume & job description, return matching keywords and accuracy %
  - Request: `{ "resume": "...", "job_description": "..." }`
  - Response: `{ "resume_keywords": [...], "job_keywords": [...], "matched_keywords": [...], "missing_keywords": [...], "accuracy_percent": 83.33 }`

### Frontend (Next.js)

- `POST /api/proxy/parse_resume` → Proxy to Flask `/parse_resume`

## Database Schema

**Supabase Tables:**

- `users` (auto-managed by Supabase Auth)
  - `id`, `email`, `created_at`, etc.

- `job_descriptions`
  - `id`, `description`, `keywords`, `created_at`, `user_id`, `extracted_skills`, `extracted_experience`, `job_title`

- `resumes`
  - `id`, `resume_text`, `keywords`, `match_score`, `created_at`, `user_id`, `file_path`, `extracted_skills`, `extracted_experience`

## Troubleshooting

1. **CORS errors**: Frontend proxy at `/api/proxy/parse_resume` forwards to backend. Ensure `BACKEND_URL` env var is set in Vercel.
2. **Supabase auth not working**: Check `supabaseUrl` and `supabaseAnonKey` in `frontend/lib/supabaseClient.js`.
3. **spaCy model not found**: Run `python -m spacy download en_core_web_sm` on backend.
4. **Backend responds 500**: Check Render logs for Flask errors.
5. **Frontend shows blank after login**: Check browser console for errors and verify `BACKEND_URL` is correct.

## License

MIT

## Author

Annmary Varghese
 
