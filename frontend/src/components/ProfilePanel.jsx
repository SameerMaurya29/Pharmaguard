import { useMemo, useState } from "react";

export default function ProfilePanel({ report }) {
  const [expanded, setExpanded] = useState(false);

  const profile = report?.pharmacogenomic_profile || {};
  const variants = profile?.detected_variants || [];

  const gene = profile?.primary_gene || "—";
  const diplotype = profile?.diplotype || "—";
  const phenotype = profile?.phenotype || "—";

  const variantSummary = useMemo(() => {
    if (!variants?.length) return "No variants detected for the primary gene (or none annotated with INFO.GENE/INFO.STAR).";
    return `${variants.length} variant(s) detected for ${gene}.`;
  }, [variants, gene]);

  return (
    <div className="glass neon-edge rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-white/60">Pharmacogenomic Profile</div>
          <div className="mt-1 text-lg font-semibold text-white">{gene}</div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:border-cyan-200/30 hover:text-white"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] text-white/60">Diplotype</div>
          <div className="mt-1 text-sm font-medium text-white/85">{diplotype}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] text-white/60">Phenotype</div>
          <div className="mt-1 text-sm font-medium text-white/85">{phenotype}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] text-white/60">Variants</div>
          <div className="mt-1 text-sm font-medium text-white/85">{variants.length}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">{variantSummary}</div>

      {expanded && (
        <div className="mt-4 space-y-2">
          {variants.map((v, idx) => (
            <div key={`${v.rsid || v.pos}-${idx}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-white/85">{v.rsid || "rsid: —"}</div>
                <div className="text-[11px] text-white/60">
                  {v.chrom}:{v.pos} {v.ref}&gt;{v.alt}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-white/60">
                gene: <span className="text-white/80">{v.gene}</span> • STAR:{" "}
                <span className="text-white/80">{v.star || "—"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

