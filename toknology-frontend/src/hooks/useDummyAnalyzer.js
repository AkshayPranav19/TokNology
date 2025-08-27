
export default function useDummyAnalyzer() {
  return (feature) => {
    const needs = /age|minor|child/i.test(feature.description) || /location|geo/i.test(feature.description);
    const unclear = /except KR|unclear|tbd/i.test(feature.description);
    const decision = unclear ? "Unclear" : needs ? "Yes" : "No";
    const confidence = unclear ? 0.55 : needs ? 0.86 : 0.78;

    const obligations = [];
    if (/age|minor|child/i.test(feature.description)) obligations.push("age_gate");
    if (/location|geo|country|cross-border/i.test(feature.description)) obligations.push("data_localization");
    if (/report|flag|abuse|csam/i.test(feature.description)) obligations.push("reporting");

    const regs = [];
    if (obligations.includes("age_gate")) regs.push("ca", "fl", "ut");
    if (obligations.includes("data_localization")) regs.push("dsa");
    if (/csam|abuse|child sexual/i.test(feature.description) || obligations.includes("reporting")) regs.push("ncmec");

    const citations = [
      { reg: "Example PRD", quote: "Feature reads user location to enforce country rules at download time." },
      { reg: "Regulation", quote: "Providers must implement appropriate age verification and parental controls." },
    ];

    const risk = Math.min(100,
      (obligations.includes("age_gate") ? 35 : 0) +
      (obligations.includes("data_localization") ? 20 : 0) +
      (/voice|image|face|biometric|pii/i.test(feature.description) ? 20 : 0) +
      (/cross-border|share|third party/i.test(feature.description) ? 10 : 0) +
      (needs ? 15 : 0)
    );

    const clarifying = decision === "Unclear"
      ? ["Does the exception for KR stem from legal constraints or market testing?",
         "Does the feature collect or store precise location or age data?"]
      : [];

    return { decision, confidence, obligations, regs: Array.from(new Set(regs)), citations, risk, clarifying };
  };
}
