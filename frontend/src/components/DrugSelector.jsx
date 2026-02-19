import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";

const DRUGS = ["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"];

export default function DrugSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = useMemo(() => new Set(value || []), [value]);

  const toggle = (drug) => {
    const next = new Set(selected);
    if (next.has(drug)) next.delete(drug);
    else next.add(drug);
    onChange?.(Array.from(next));
  };

  const label = (value?.length || 0) === 0 ? "Select drugs" : `${value.length} selected`;

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="glass neon-edge flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-sm text-white/90 hover:border-cyan-200/30"
      >
        <div className="flex flex-col gap-1">
          <div className="text-xs text-white/60">Drug Selector</div>
          <div className="text-sm font-medium text-white">{label}</div>
        </div>
        <div className="text-xs text-white/60">{open ? "Close" : "Open"}</div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="glass neon-edge absolute z-30 mt-3 w-full overflow-hidden rounded-2xl"
          >
            <div className="max-h-64 overflow-auto p-2">
              {DRUGS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(d)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-white/85 hover:bg-white/5"
                >
                  <span className="font-medium">{d}</span>
                  <span
  className={`relative flex h-5 w-5 items-center justify-center rounded-md border ${
    selected.has(d)
      ? "border-emerald-300/50 bg-emerald-300/25 shadow-[0_0_20px_rgba(16,185,129,.18)]"
      : "border-white/15 bg-white/5"
  }`}
  aria-hidden="true"
>
  {selected.has(d) && <span className="text-emerald-200 text-sm font-bold">✔</span>}
</span>
                </button>
              ))}
            </div>
            <div className="border-t border-white/10 p-3">
              <div className="flex flex-wrap gap-2">
                {(value || []).map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
                  >
                    {d}
                    <button
                      type="button"
                      onClick={() => toggle(d)}
                      className="rounded-full px-1 text-white/60 hover:text-white"
                      aria-label={`Remove ${d}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

