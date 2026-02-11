import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/home.module.css";

export default function Results() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("analysis_input");
      if (!raw) {
        alert("No analysis input found. Please upload a resume and try again.");
        router.push("/");
        return;
      }
      const parsed = JSON.parse(raw);
      setInput(parsed);

      // try to reuse cached match result
      const cached = sessionStorage.getItem("match_result");
      if (cached) {
        setResult(JSON.parse(cached));
        setLoading(false);
        return;
      }

      // call backend to compute analysis
      (async () => {
        setLoading(true);
        try {
          const res = await fetch("http://localhost:5000/parse_resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume: parsed.resumeText, job_description: parsed.jobDescription }),
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${res.status}`);
          }
          const data = await res.json();
          setResult(data);
          try { sessionStorage.setItem("match_result", JSON.stringify(data)); } catch (e) {}
        } catch (e) {
          console.error(e);
          setError(e.message || "Error during analysis");
        } finally {
          setLoading(false);
        }
      })();
    } catch (e) {
      console.error(e);
      alert("Invalid analysis input. Returning home.");
      router.push("/");
    }
  }, [router]);

  if (loading) {
    return (
      <div className={styles.container} style={{ padding: 40 }}>
        <h2>Analyzing...</h2>
        <p>Please wait while we analyze the resume against the job description.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container} style={{ padding: 40 }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button className={styles.primaryBtn} onClick={() => router.push("/")}>Back</button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Analysis Results</h1>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.resultsCard}>
          <h2>📊 Match Results</h2>

          <div className={styles.scoreGrid}>
            <div className={styles.scoreBox}>
              <div className={styles.scoreValue}>{result.accuracy_percent}%</div>
              <div className={styles.scoreLabel}>Keyword Match</div>
            </div>
            <div className={styles.scoreBox}>
              <div className={styles.scoreValue}>{result.skill_match_percent}%</div>
              <div className={styles.scoreLabel}>Skill Match</div>
            </div>
          </div>

          <div className={styles.scoreGrid}>
            <div className={styles.scoreBox}>
              <div className={styles.scoreValue}>{result.strength_score}%</div>
              <div className={styles.scoreLabel}>Strength Score</div>
            </div>
            <div className={styles.scoreBox}>
              <div className={styles.scoreValue}>{result.years_experience} yrs</div>
              <div className={styles.scoreLabel}>Experience</div>
            </div>
          </div>

          {result.core_summary && (
            <div className={styles.summarySection}>
              <h3>🔎 Resume Core Summary</h3>
              <div className={styles.summaryBox}>{result.core_summary}</div>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <strong>Experience Level:</strong> {result.experience_level}
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Eligibility:</strong> <span style={{ marginLeft: 8 }}>{result.eligible ? 'Eligible ✅' : 'Not Eligible ❌'}</span>
          </div>

          {result.feedback && (
            <div className={styles.feedbackSection} style={{ marginTop: 12 }}>
              <h3>📝 Feedback</h3>
              <div className={styles.feedbackBox}>
                <p><strong>Overall:</strong> {result.feedback.overall}</p>
                <p><strong>Skills:</strong> {result.feedback.skills}</p>
                <p><strong>Strengths:</strong> {result.feedback.strengths}</p>
                <p><strong>Improvements:</strong> {result.feedback.improvements}</p>
              </div>
            </div>
          )}

          {result.matched_skills && result.matched_skills.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3>✅ Matched Skills</h3>
              <div className={styles.tags}>
                {result.matched_skills.map((s, i) => <span key={i} className={styles.tagGreen}>{s}</span>)}
              </div>
            </div>
          )}

          {result.missing_skills && result.missing_skills.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3>⚠️ Missing Skills</h3>
              <div className={styles.tags}>
                {result.missing_skills.map((s, i) => <span key={i} className={styles.tagRed}>{s}</span>)}
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <button className={styles.primaryBtn} onClick={() => router.push("/")}>Back</button>
          </div>
        </div>
      </div>
    </div>
  );
}
