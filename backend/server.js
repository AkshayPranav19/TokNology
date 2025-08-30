// backend/server.js
import express from "express";
import axios from "axios";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import { Pool } from "pg";

/* ================================
   Config
================================ */
const PORT = process.env.PORT || 5050;
const AGENT1_URL =
  process.env.AGENT1_URL || "http://localhost:8000/v1/run"; // LawFinder
const AGENT2_URL =
  process.env.AGENT2_URL ||
  "http://localhost:18002/agent3/assess-demo"; // Risk Evaluator

// Frontend origins allowed to call this server (comma-separated)
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

dotenv.config();

const pool = new Pool({
  connectionString: `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}` +
                    `@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`,
});

/* ================================
   App setup
================================ */
const app = express();
app.use(
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "1mb" }));

process.on("uncaughtException", (err) => console.error("[uncaughtException]", err));
process.on("unhandledRejection", (err) => console.error("[unhandledRejection]", err));

app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

/* ================================
   Debug routes
================================ */
app.get("/healthz", (_req, res) =>
  res.json({ ok: true, port: PORT, agent1: AGENT1_URL, agent2: AGENT2_URL })
); 

app.get("/__routes", (_req, res) => {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route?.path) {
      routes.push({
        path: m.route.path,
        methods: Object.keys(m.route.methods).map((x) => x.toUpperCase()),
      });
    }
  });
  res.json({ routes });
});

app.post("/echo", (req, res) => res.json({ ok: true, received: req.body }));

app.post("/a1-test", async (req, res) => {
  try {
    const body =
      req.body && Object.keys(req.body).length
        ? req.body
        : { feature_summary: "Ping from 5050", regions: ["Utah"], min_year: 2023 };

    const r = await axios.post(AGENT1_URL, body, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
      httpAgent: new http.Agent({ keepAlive: false }),
      validateStatus: () => true,
    });

    res.status(200).json({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      url: AGENT1_URL,
      sent: body,
      data: r.data,
    });
  } catch (err) {
    console.error("[/a1-test] upstream error:", err?.message || err);
    res.status(502).json({ ok: false, url: AGENT1_URL, error: err?.message || "Failed to reach Agent1" });
  }
});

app.post("/a2-test", async (req, res) => {
  try {
    const body =
      req.body && Object.keys(req.body).length
        ? req.body
        : {
            law_agent_input: {
              index_id: "fc53f13c56d4",
              sources: [
                {
                  url: "https://dcp.utah.gov/wp-content/uploads/2023/12/Social-Media-Regulation-PDF.pdf",
                  title: "Utah Social Media Regulation Act (PDF)",
                  jurisdiction: "Utah",
                  snippet: "Primary statute source.",
                },
              ],
            },
            user_policy: {
              topic: "Curfew login blocker with ASL/GH for Utah minors",
              description: "Backend /a2-test default payload.",
              document_points: [],
            },
            use_gemini: false,
          };

    const r = await axios.post(AGENT2_URL, body, {
      headers: { "Content-Type": "application/json" },
      timeout: 20000,
      httpAgent: new http.Agent({ keepAlive: false }),
      validateStatus: () => true,
    });

    res.status(200).json({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      url: AGENT2_URL,
      sent: { ...body, law_agent_input: { ...body.law_agent_input, sources: `( ${body?.law_agent_input?.sources?.length ?? 0} items )` } },
      data: r.data,
    });
  } catch (err) {
    console.error("[/a2-test] upstream error:", err?.message || err);
    res.status(502).json({ ok: false, url: AGENT2_URL, error: err?.message || "Failed to reach Agent2" });
  }
});

/* ================================
   Helpers / Normalizers
================================ */
const uniq = (arr = []) => Array.from(new Set(arr.filter(Boolean)));

function arrify(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function normalizeAgent1(a1) {
  const sources = a1?.sources || a1?.law_sources || a1?.data?.sources || a1?.data?.law_sources || [];
  const regulations = a1?.regulations_hit || a1?.regulations || a1?.data?.regulations_hit || [];
  const regions = a1?.regions_hit || a1?.regions || a1?.data?.regions_hit || [];
  const obligations = a1?.obligations || a1?.key_obligations || a1?.data?.key_obligations || [];
  const citations = a1?.citations || a1?.data?.citations || [];
  return {
    regions_hit: uniq(regions),
    regulations_hit: uniq(regulations),
    key_obligations: uniq(obligations.map(String)),
    citations: uniq(citations.map(String)),
    evidence_urls: uniq(sources.map((s) => s?.url).filter(Boolean)),
    _raw_sources: sources,
  };
}

function normalizeAgent2(a2) {
  // unwrap numeric score (accepts number or {value})
  const rawVal =
    a2?.risk_score ??
    a2?.riskScore ??
    a2?.score ??
    a2?.assessment?.risk_score ??
    a2?.assessment?.score ??
    0;
  const value = typeof rawVal === "object" ? rawVal?.value ?? 0 : rawVal;

  // build rationale from top 3 "why" items
  const whyArr = Array.isArray(a2?.why) ? a2.why : [];
  const top3Why = whyArr.slice(0, 3).map((w) => {
    const issue = w?.issue || "Issue";
    const rat = w?.rationale || w?.reason || "";
    const sev = w?.severity ? ` [${w.severity}]` : "";
    const cov = w?.coverage ? ` (${w.coverage})` : "";
    return `• ${issue}${sev}${cov}: ${rat}`.trim();
  });

  const fallbackRationale =
    a2?.rationale ||
    a2?.reason ||
    a2?.assessment?.rationale ||
    a2?.assessment?.reason ||
    "";
  const rationale = top3Why.length ? top3Why.join("\n") : String(fallbackRationale || "No rationale provided");

  // stringify obligations to plain text
  const obArr = Array.isArray(a2?.obligations) ? a2.obligations : [];
  const obligations = obArr.map((o) => {
    const title = o?.title || o?.obligation_id || "Obligation";
    const cov = o?.coverage ? ` — ${o.coverage}` : "";
    const sev = o?.severity ? ` (${o.severity})` : "";
    const reason = o?.reason ? `: ${o.reason}` : "";
    return `${title}${cov}${sev}${reason}`.trim();
  });

  // citations + evidence URLs
  const auditCits = Array.isArray(a2?.audit_citations) ? a2.audit_citations : [];
  const citStrings = auditCits.map((c) => {
    const label = c?.label || "Source";
    const url = c?.url || "";
    return url ? `${label} — ${url}` : label;
  });

  const extraCit = Array.isArray(a2?.citations) ? a2.citations : [];
  const citations = uniq([...citStrings, ...extraCit.map(String)]);

  const evidence_urls = uniq([
    ...auditCits.map((c) => c?.url).filter(Boolean),
    ...(Array.isArray(a2?.evidence_urls) ? a2.evidence_urls : []),
  ]);

  // regions/regulations hit from Agent2 side as well
  const regionsA2 = arrify(a2?.regions).map(String);
  const regsA2 = arrify(a2?.regulations_hit).map(String);

  return {
    score: { value: Number(value) || 0, rationale },
    extras: {
      key_obligations: obligations,
      citations,
      evidence_urls,
      regions_hit: regionsA2,
      regulations_hit: regsA2,
    },
  };
}

/* ================================
   Main orchestrator
================================ */
app.post("/analyze", async (req, res) => {
  const { title, description, regions = [] } = req.body || {};
  if (!title || !description) {
    return res.status(400).json({ error: "Missing required fields: title, description" });
  }

  try {
    // 1) Agent1 (LawFinder)
    const a1Payload = {
      feature_summary: `${title.trim()}\n\n${description.trim()}`,
      regions: regions.length ? regions : ["global"],
      min_year: 2023,
    };

    const a1Resp = await axios.post(AGENT1_URL, a1Payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 20000,
      httpAgent: new http.Agent({ keepAlive: false }),
      validateStatus: () => true,
    });

    if (!(a1Resp.status >= 200 && a1Resp.status < 300)) {
      return res.status(502).json({
        error: "Agent1 returned non-2xx",
        status: a1Resp.status,
        data: a1Resp.data,
      });
    }

    const a1 = a1Resp.data;
    const a1Norm = normalizeAgent1(a1);

    // 2) Agent2 using Agent1’s sources + user policy
    const a2Payload = {
      law_agent_input: {
        index_id: a1?.index_id || "dynamic-index",
        sources: a1Norm._raw_sources?.length ? a1Norm._raw_sources : (a1?.sources || []),
      },
      user_policy: {
        topic: title.trim(),
        description: description.trim(),
        document_points: [],
      },
      use_gemini: false,
    };

    const a2Resp = await axios.post(AGENT2_URL, a2Payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 25000,
      httpAgent: new http.Agent({ keepAlive: false }),
      validateStatus: () => true,
    });

    if (!(a2Resp.status >= 200 && a2Resp.status < 300)) {
      return res.status(502).json({
        error: "Agent2 returned non-2xx",
        status: a2Resp.status,
        data: a2Resp.data,
      });
    }

    const a2 = a2Resp.data;
    const a2Norm = normalizeAgent2(a2);

    // 3) Merge → UI contract
    const findings = {
      // Regions: from A1 + A2
      regions_hit: uniq([...a1Norm.regions_hit, ...(a2Norm.extras.regions_hit || [])]),
      // Regulations: from A1 + A2
      regulations_hit: uniq([...a1Norm.regulations_hit, ...(a2Norm.extras.regulations_hit || [])]),
      // Obligations: readable text from A2 plus any A1 text
      key_obligations: uniq([...a1Norm.key_obligations, ...a2Norm.extras.key_obligations]),
      // Citations (strings) and Evidence URLs (for links under Why)
      citations: uniq([...a1Norm.citations, ...a2Norm.extras.citations]),
      evidence_urls: uniq([...a1Norm.evidence_urls, ...a2Norm.extras.evidence_urls]),
    };

    const score = a2Norm.score; // { value, rationale (joined top-3 why) }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const runId = `run-${Date.now()}`;

      const featureRes = await client.query(
        `INSERT INTO feature_runs (run_id, run_time, feature_name, risk_score)
         VALUES ($1, NOW(), $2, $3) RETURNING id`,
        [runId, title.trim(), score?.value?.toString() || null]
      );
      const featureRunId = featureRes.rows[0].id;

      // Insert regions
      const regionIds = [];
      for (const regionName of findings.regions_hit) {
        const resRegion = await client.query(
          `INSERT INTO regions (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
          [regionName]
        );
        regionIds.push(resRegion.rows[0].id);
      }

      const regulationIds = [];
      for (const regName of findings.regulations_hit) {
        const resReg = await client.query(
          `INSERT INTO regulations (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
          [regName]
        );
        regulationIds.push(resReg.rows[0].id);
      }

      for (const rId of regionIds) {
        await client.query(
          `INSERT INTO run_regions (run_id, region_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [featureRunId, rId]
        );
      }

      for (const regId of regulationIds) {
        await client.query(
          `INSERT INTO run_regulations (run_id, regulation_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [featureRunId, regId]
        );
      }

      await client.query("COMMIT");
      console.log(`Saved analysis run ${runId} to database`);
    } catch (dbErr) {
      await client.query("ROLLBACK");
      console.error("[/analyze] DB error:", dbErr.message);
    } finally {
      client.release();
    }

    return res.json({
      findings,
      score,
      raw: { agent1: a1, agent2: a2 },
    });
  } catch (err) {
    console.error("[/analyze] error:", err?.response?.data || err?.message || err);
    return res.status(500).json({
      error: "Analyze failed",
      detail: err?.message || "unknown",
      upstream: err?.response?.data,
    });
  }
});

app.get("/feature-runs", async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT fr.id,
                fr.run_id,
                fr.run_time,
                fr.feature_name,
                fr.risk_score,
                COALESCE(
                  ARRAY(
                    SELECT r.name
                    FROM run_regions rr
                    JOIN regions r ON rr.region_id = r.id
                    WHERE rr.run_id = fr.id
                  ), '{}'
                ) AS regions,
                COALESCE(
                  ARRAY(
                    SELECT reg.name
                    FROM run_regulations rrn
                    JOIN regulations reg ON rrn.regulation_id = reg.id
                    WHERE rrn.run_id = fr.id
                  ), '{}'
                ) AS regulations
         FROM feature_runs fr
         ORDER BY fr.run_time DESC
         LIMIT 50`
      );
      res.json({ ok: true, runs: result.rows });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[/feature-runs] DB error:", err.message);
    res.status(500).json({ ok: false, error: "Failed to fetch feature runs" });
  }
});

/* ================================
   Start
================================ */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`↔ Agent1: ${AGENT1_URL}`);
  console.log(`↔ Agent2: ${AGENT2_URL}`);
});
