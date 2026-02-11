import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import styles from "../styles/home.module.css";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  const signUp = async () => {
    if (!email || !password) return alert("Please fill in all fields");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) alert(error.message);
    else alert("Check your email for confirmation");
  };

  const signIn = async () => {
    if (!email || !password) return alert("Please fill in all fields");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) alert(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setParsedData(null);
    setMatchResult(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      uploadResume(file);
    }
  };

  const uploadResume = async (file) => {
    if (!file) return;
    setLoading(true);
    setUploadProgress(30);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(60);
      const res = await fetch("http://localhost:5000/upload_resume_file", {
        method: "POST",
        body: formData,
      });
      setUploadProgress(90);
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        // store parsed fields and full extracted text
        setParsedData(data.data);
        setResumeText(data.text || "");
        setUploadProgress(100);
      }
    } catch (err) {
      alert("Error uploading resume: " + err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const router = useRouter();

  const matchResume = async () => {
    // keep button always visible; validate inputs and navigate to /results
    if (!parsedData) {
      alert("Please upload a resume first.");
      return;
    }
    if (!jobDescription || !jobDescription.trim()) {
      alert("Please enter a job description.");
      return;
    }

    // store inputs in sessionStorage for the /results page to consume
    const payload = {
      resumeText: resumeText || parsedData.keywords?.join(" ") || "",
      jobDescription: jobDescription,
      parsedData: parsedData,
    };
    try {
      sessionStorage.setItem("analysis_input", JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not save analysis input to sessionStorage", e);
    }

    router.push("/results");
  };

  if (!user) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.bg} />
        <div className={styles.authBox}>
          <h1>Resume Parser</h1>
          <p>Analyze your resume match with job descriptions</p>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className={styles.buttonGroup}>
            <button onClick={signIn} disabled={loading} className={styles.primaryBtn}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <button onClick={signUp} disabled={loading} className={styles.secondaryBtn}>
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </div>

          <p className={styles.hint}>Demo: Use any email and password</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Resume Parser</h1>
          <div className={styles.userSection}>
            <span>{user.email}</span>
            <button onClick={signOut} className={styles.logoutBtn}>Sign Out</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.container}>
        <div className={styles.mainGrid}>
          {/* Upload Section */}
          <div className={styles.card}>
            <h2>📄 Resume</h2>
            <div className={styles.uploadArea}>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                disabled={loading}
                id="fileInput"
              />
              <label htmlFor="fileInput" className={styles.uploadLabel}>
                <div className={styles.uploadIcon}>📁</div>
                <p>Drop your resume here or click to browse</p>
                <span>Supports PDF, DOCX, DOC, TXT</span>
              </label>
              {uploadProgress > 0 && (
                <div className={styles.progressBar}>
                  <div style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              {resumeFile && <p className={styles.fileName}>✓ {resumeFile.name}</p>}
            </div>

            {parsedData && (
              <div className={styles.parsedInfo}>
                <h3>Extracted Information</h3>
                <div className={styles.infoGrid}>
                  {parsedData.name && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Name</span>
                      <span className={styles.value}>{parsedData.name}</span>
                    </div>
                  )}
                  {parsedData.email && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Email</span>
                      <span className={styles.value}>{parsedData.email}</span>
                    </div>
                  )}
                  {parsedData.phone && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Phone</span>
                      <span className={styles.value}>{parsedData.phone}</span>
                    </div>
                  )}
                  {parsedData.experience && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Experience</span>
                      <span className={styles.value}>{parsedData.experience} years</span>
                    </div>
                  )}
                </div>

                {parsedData.education && parsedData.education.length > 0 && (
                  <div>
                    <p className={styles.label}>Education</p>
                    <div className={styles.tags}>
                      {parsedData.education.map((edu, i) => (
                        <span key={i} className={styles.tag}>{edu}</span>
                      ))}
                    </div>
                  </div>
                )}

                {parsedData.skills && parsedData.skills.length > 0 && (
                  <div>
                    <p className={styles.label}>Skills</p>
                    <div className={styles.tags}>
                      {parsedData.skills.map((skill, i) => (
                        <span key={i} className={styles.tag}>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Job Description Section */}
          <div className={styles.card}>
            <h2>💼 Job Description</h2>
            <div className={styles.formGroup}>
              <textarea
                placeholder="Paste the job description or required skills here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={10}
              />
            </div>

            <button onClick={matchResume} disabled={!parsedData || !jobDescription.trim()} className={styles.primaryBtn}>
              {loading ? "⏳ Analyzing..." : "📊 Analyze Match"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {matchResult && (
          <div className={styles.resultsCard}>
            <h2>📊 Match Results</h2>

            {/* Accuracy Scores */}
            <div className={styles.scoreGrid}>
              <div className={styles.scoreBox}>
                <div className={styles.scoreValue}>{matchResult.accuracy_percent}%</div>
                <div className={styles.scoreLabel}>Keyword Match</div>
              </div>
              <div className={styles.scoreBox}>
                <div className={styles.scoreValue}>{matchResult.skill_match_percent}%</div>
                <div className={styles.scoreLabel}>Skill Match</div>
              </div>
            </div>

            <div className={styles.scoreGrid}>
              <div className={styles.scoreBox}>
                <div className={styles.scoreValue}>{matchResult.strength_score}%</div>
                <div className={styles.scoreLabel}>Strength Score</div>
              </div>
              <div className={styles.scoreBox}>
                <div className={styles.scoreValue}>{matchResult.years_experience} yrs</div>
                <div className={styles.scoreLabel}>Experience</div>
              </div>
            </div>

            {/* Feedback */}
            {matchResult.feedback && (
              <div className={styles.feedbackSection}>
                <h3>📝 Feedback</h3>
                <div className={styles.feedbackBox}>
                  <p><strong>Overall:</strong> {matchResult.feedback.overall}</p>
                  <p><strong>Skills:</strong> {matchResult.feedback.skills}</p>
                  <p><strong>Strengths:</strong> {matchResult.feedback.strengths}</p>
                  <p><strong>Improvements:</strong> {matchResult.feedback.improvements}</p>
                </div>
              </div>
            )}

            {/* Core summary and eligibility */}
            {matchResult.core_summary && (
              <div className={styles.summarySection}>
                <h3>🔎 Resume Core Summary</h3>
                <div className={styles.summaryBox}>{matchResult.core_summary}</div>
              </div>
            )}

            <div className={styles.eligibilityRow}>
              <strong>Eligibility:</strong>
              <span style={{ marginLeft: 8 }}>{matchResult.eligible ? 'Eligible ✅' : 'Not Eligible ❌'}</span>
            </div>

            {/* Matched Skills */}
            {matchResult.matched_skills && matchResult.matched_skills.length > 0 && (
              <div>
                <h3 className={styles.matchedTitle}>✅ Matched Skills</h3>
                <div className={styles.tags}>
                  {matchResult.matched_skills.map((skill, i) => (
                    <span key={i} className={styles.tagGreen}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {matchResult.missing_skills && matchResult.missing_skills.length > 0 && (
              <div>
                <h3 className={styles.missingTitle}>⚠️ Missing Skills</h3>
                <div className={styles.tags}>
                  {matchResult.missing_skills.map((skill, i) => (
                    <span key={i} className={styles.tagRed}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
