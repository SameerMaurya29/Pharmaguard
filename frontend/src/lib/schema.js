export const REQUIRED_REPORT_KEYS = [
  "patient_id",
  "drug",
  "timestamp",
  "risk_assessment",
  "pharmacogenomic_profile",
  "clinical_recommendation",
  "llm_generated_explanation",
  "quality_metrics",
];

export function validateReportShape(report) {
  const missing = REQUIRED_REPORT_KEYS.filter((k) => !(k in (report || {})));
  return { ok: missing.length === 0, missing };
}

