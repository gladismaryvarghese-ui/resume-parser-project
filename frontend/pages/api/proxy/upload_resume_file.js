export default async function handler(req, res) {
  const backend = process.env.BACKEND_URL || "http://127.0.0.1:5000";
  const url = backend + "/upload_resume_file";

  try {
    const r = await fetch(url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
