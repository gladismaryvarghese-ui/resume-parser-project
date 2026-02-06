import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email for confirmation (if enabled)");
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const parseResume = async () => {
    setResult(null);
    const res = await fetch("/api/proxy/parse_resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, job_description: jobDesc }),
    });
    const json = await res.json();
    setResult(json);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Resume Parser</h1>

      {!user ? (
        <div style={{ maxWidth: 480 }}>
          <h2>Sign In / Sign Up</h2>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={signIn}>Sign In</button>
            <button onClick={signUp}>Sign Up</button>
          </div>
          <p style={{ marginTop: 12 }}>
            Sessions are persisted by Supabase; you will remain logged in until you sign out.
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: 800 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>Signed in: {user.email}</div>
            <button onClick={signOut}>Sign Out</button>
          </div>

          <h2>Job / Keywords (enter a job description or comma-separated keywords)</h2>
          <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={3} style={{ width: "100%" }} />

          <h2>Paste Resume Text</h2>
          <textarea value={resume} onChange={(e) => setResume(e.target.value)} rows={8} style={{ width: "100%" }} />

          <div style={{ marginTop: 12 }}>
            <button onClick={parseResume}>Parse & Score</button>
          </div>

          {result && (
            <div style={{ marginTop: 18 }}>
              <h3>Result</h3>
              <div><strong>Accuracy:</strong> {result.accuracy_percent}%</div>
              <div style={{ marginTop: 8 }}><strong>Matched keywords:</strong> {result.matched_keywords.join(", ")}</div>
              <div style={{ marginTop: 8 }}><strong>Missing keywords:</strong> {result.missing_keywords.join(", ")}</div>
              <pre style={{ background: "#f7f7f7", padding: 8 }}>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
