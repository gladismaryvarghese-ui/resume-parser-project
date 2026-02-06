export default async function handler(req, res) {
  // Simple proxy to backend to avoid CORS issues in local dev
  const backend = process.env.BACKEND_URL || "http://127.0.0.1:5000";
  const url = backend + "/parse_resume";

  try {
    const r = await fetch(url, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
