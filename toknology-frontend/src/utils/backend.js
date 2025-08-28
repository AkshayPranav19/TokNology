// src/utils/backend.js
import axios from "axios";

// Ensure there is exactly one slash between base and path
function join(base, path) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

// Hit Express directly in dev.
// Pass VITE_API_BASE=http://localhost:5050 when running `npm run dev`.
const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_BASE) ||
  "http://localhost:5050";

export async function runAnalyze({ title, description, regions }) {
  const url = join(API_BASE, "/analyze");
  const payload = { title, description, regions };

  const { data } = await axios.post(url, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });

  // data must be { findings, score, raw }
  return data;
}
