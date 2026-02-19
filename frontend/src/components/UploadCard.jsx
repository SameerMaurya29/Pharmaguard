import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function fmtBytes(n) {
  if (!n && n !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function UploadCard({ file, onFile, onError }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const hint = useMemo(() => {
    if (!file) return "Drop your .vcf here or click to browse.";
    return `${file.name} • ${fmtBytes(file.size)}`;
  }, [file]);

  const accept = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".vcf")) {
      onError?.("Please upload a .vcf file.");
      return;
    }
    if (f.size > MAX_BYTES) {
      onError?.(`File too large. Max ${fmtBytes(MAX_BYTES)}.`);
      return;
    }
    onFile?.(f);
  };

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDrag(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDrag(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDrag(false);
        const f = e.dataTransfer?.files?.[0];
        accept(f);
      }}
      className={`glass neon-edge group relative w-full rounded-2xl p-5 text-left transition ${
        drag ? "border-cyan-200/40 shadow-glow" : "border-white/10"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".vcf"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium text-white">VCF Upload</div>
          <div className="text-xs text-white/60">{hint}</div>
        </div>

        <div
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition group-hover:border-cyan-200/30 group-hover:text-white"
          aria-hidden="true"
        >
          Browse
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-white/55">
        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">CYP2D6</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">CYP2C19</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">CYP2C9</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">SLCO1B1</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">TPMT</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">DPYD</div>
      </div>
    </motion.button>
  );
}

