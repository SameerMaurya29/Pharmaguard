import { motion } from "framer-motion";

function badgeStyle(risk) {
  const r = (risk || "Unknown").toLowerCase();
  if (r === "safe") return { label: "Safe", cls: "bg-emerald-300/15 border-emerald-200/25 text-emerald-100" };
  if (r === "adjust dosage")
    return { label: "Adjust Dosage", cls: "bg-yellow-300/15 border-yellow-200/25 text-yellow-50" };
  if (r === "toxic") return { label: "Toxic", cls: "bg-red-400/15 border-red-200/25 text-red-50" };
  if (r === "ineffective") return { label: "Ineffective", cls: "bg-red-400/15 border-red-200/25 text-red-50" };
  return { label: "Unknown", cls: "bg-white/6 border-white/12 text-white/75" };
}

export default function RiskPanel({ report }) {
  const risk = report?.risk_assessment?.risk_label || "Unknown";
  const severity = report?.risk_assessment?.severity || "none";
  const conf = report?.risk_assessment?.confidence_score ?? 0;
  const drug = report?.drug || "";

  const b = badgeStyle(risk);

  return (
    <div className="glass neon-edge rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-white/60">Risk Assessment</div>
          <div className="mt-1 text-lg font-semibold text-white">{drug}</div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_0_20px_rgba(34,211,238,.08)] ${b.cls}`}
        >
          {b.label}
        </motion.div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] text-white/60">Severity</div>
          <div className="mt-1 text-sm font-medium text-white/85">{severity}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] text-white/60">Confidence</div>
          <div className="mt-1 text-sm font-medium text-white/85">{Math.round(conf * 100)}%</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] text-white/60">Timestamp</div>
          <div className="mt-1 truncate text-sm font-medium text-white/85">{report?.timestamp || "—"}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-[11px] text-white/60">Clinical Recommendation</div>
        <div className="mt-2 text-sm leading-relaxed text-white/80">{report?.clinical_recommendation || "—"}</div>
      </div>
    </div>
  );
}

