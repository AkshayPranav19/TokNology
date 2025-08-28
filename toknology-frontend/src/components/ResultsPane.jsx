// src/components/ResultsPane.jsx
import React from "react";
import { Card, Chip, Badge } from "./Primitives.jsx";

const ALL_REGULATIONS = [
  { id: "dsa", name: "EU Digital Services Act (DSA)" },
  { id: "ca", name: "CA Protecting Our Kids from Social Media Addiction" },
  { id: "fl", name: "Florida Online Protections for Minors" },
  { id: "ut", name: "Utah Social Media Regulation Act" },
  { id: "ncmec", name: "US NCMEC Reporting (CSAM)" },
];

// helper: find pretty name if id matches our known pack
function prettyRegName(raw) {
  if (!raw) return "";
  const id = String(raw).toLowerCase().trim();
  const hit = ALL_REGULATIONS.find((r) => r.id === id);
  return hit ? hit.name : String(raw);
}

export default function ResultsPane({ regions = [], result }) {
  const d = result?.decision || null;

  // ----- risk + chip -----
  const riskNum =
    typeof d?.riskScore === "number" && Number.isFinite(d.riskScore)
      ? Math.max(0, Math.min(100, d.riskScore))
      : null;

  let chipColor = "zinc";
  let chipLabel = "Awaiting analysis";
  if (riskNum !== null) {
    if (riskNum < 35) {
      chipColor = "emerald";
      chipLabel = `Low • ${riskNum}%`;
    } else if (riskNum < 70) {
      chipColor = "amber";
      chipLabel = `Medium • ${riskNum}%`;
    } else {
      chipColor = "rose";
      chipLabel = `High • ${riskNum}%`;
    }
  }

  // ----- fields -----
  const regionsHit = Array.isArray(d?.regions) ? d.regions : [];
  const regulationsHit = Array.isArray(d?.regulations) ? d.regulations : [];
  const obligations = Array.isArray(d?.obligations) ? d.obligations : [];
  const citations = Array.isArray(d?.citations) ? d.citations : [];
  const rationale = (d?.rationale || "").toString();

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Decision</h3>
          <p className="text-sm text-zinc-500">
            Needs geo-specific compliance logic?
          </p>
        </div>
        <Chip color={chipColor}>{chipLabel}</Chip>
      </div>

      {/* top summary */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-zinc-500">Regions</p>
          <p className="text-sm mt-1">
            {(regionsHit.length ? regionsHit : regions).join(", ") || "—"}
          </p>
        </Card>

        <Card className="p-3">
          <p className="text-xs text-zinc-500">Regulations Hit</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {regulationsHit.length ? (
              regulationsHit.map((id, i) => (
                <Badge key={`${id}-${i}`}>{prettyRegName(id)}</Badge>
              ))
            ) : (
              <span className="text-sm">—</span>
            )}
          </div>
        </Card>

        <Card className="p-3">
          <p className="text-xs text-zinc-500">Risk Score</p>
          <div className="mt-2">
            <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${riskNum ?? 0}%` }}
              />
            </div>
            <p className="mt-1 text-sm">{riskNum ?? 0}/100</p>
          </div>
        </Card>
      </div>

      {/* why + citations */}
      <div className="mt-4">
        <p className="text-sm font-medium">Why (with citations)</p>
        <div className="mt-2 space-y-2">
          <div className="rounded-lg border border-zinc-200 p-3 text-sm bg-zinc-50 text-zinc-700">
            {rationale.trim()
              ? rationale
              : "Run an analysis to see rationales and citations."}
          </div>

          {citations.length > 0 &&
            citations.map((c, idx) => {
              // support either strings or objects { reg, quote }
              if (typeof c === "string") {
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-200 p-3 text-sm bg-zinc-50 text-zinc-700"
                  >
                    {c}
                  </div>
                );
              }
              const reg = c?.reg || c?.regulation || "";
              const quote = c?.quote || c?.text || c?.snippet || "";
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-200 p-3 text-sm bg-zinc-50"
                >
                  {reg ? (
                    <span className="font-medium text-zinc-700">
                      {prettyRegName(reg)}:
                    </span>
                  ) : null}{" "}
                  <span className="text-zinc-700">
                    {quote ? `“${quote}”` : ""}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* obligations */}
      <div className="mt-4">
        <p className="text-sm font-medium">Obligations</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {obligations.length ? (
            obligations.map((o, i) => {
              const id = String(o).toLowerCase().replace(/\s+/g, "_");
              const colorMap = {
                age_gate: "amber",
                data_localization: "sky",
                reporting: "rose",
                notice: "violet",
                consent: "emerald",
              };
              const labelMap = {
                age_gate: "Age Gate",
                data_localization: "Data Localization",
                reporting: "Reporting",
                notice: "Notice",
                consent: "Consent",
              };
              return (
                <Chip key={`${o}-${i}`} color={colorMap[id] || "slate"}>
                  {labelMap[id] || String(o)}
                </Chip>
              );
            })
          ) : (
            <span className="text-sm text-zinc-500">—</span>
          )}
        </div>
      </div>

      {/* optional clarifying questions if you ever add them */}
      {Array.isArray(result?.clarifying) && result.clarifying.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium">Clarifying Questions</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700 space-y-1">
            {result.clarifying.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
