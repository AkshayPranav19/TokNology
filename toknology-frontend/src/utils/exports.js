
export function exportCSV({ title, regions, result }) {
  const rows = [
    ["feature_id","feature_title","needs_geo_logic","confidence","regions","regulations_hit","obligation_types","top_rationale","risk_score"],
    [
      "FEAT-001",
      JSON.stringify(title || "Demo Feature"),
      result?.decision || "Unclear",
      (result?.confidence ?? 0).toFixed(2),
      regions.join(";"),
      (result?.regs || []).join(";"),
      (result?.obligations || []).join(";"),
      JSON.stringify(result?.citations?.[0]?.quote || ""),
      result?.risk ?? 0,
    ],
  ];
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "toknology_output.csv"; a.click();
  URL.revokeObjectURL(url);
}

export function exportEvidenceHTML({ title, regions, result }) {
  const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>Evidence Pack</title></head><body style=\"font-family:system-ui,Segoe UI,Arial\">`
    + `<h1>Evidence Pack — TokNology (Mock)</h1>`
    + `<p><b>Feature:</b> ${title || "Demo Feature"}</p>`
    + `<p><b>Decision:</b> ${result?.decision || "Unclear"} (conf ${(result?.confidence ?? 0).toFixed(2)})</p>`
    + `<p><b>Regions:</b> ${regions.join(", ")}</p>`
    + `<p><b>Regulations:</b> ${(result?.regs || []).join(", ")}</p>`
    + `<p><b>Obligations:</b> ${(result?.obligations || []).join(", ")}</p>`
    + `<h3>Citations</h3>`
    + `<ul>${(result?.citations || []).map(c => `<li><i>${c.reg}</i>: \"${c.quote}\"</li>`).join("")}</ul>`
    + `<p style=\"margin-top:24px;font-size:12px;color:#555\">Generated locally as a mock HTML evidence file.</p>`
    + `</body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "toknology_evidence_mock.html"; a.click();
  URL.revokeObjectURL(url);
}
