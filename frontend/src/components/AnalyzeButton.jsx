import { motion } from "framer-motion";

export default function AnalyzeButton({ disabled, loading, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? {} : { scale: 1.01 }}
      whileTap={disabled || loading ? {} : { scale: 0.99 }}
      className={`relative w-full rounded-2xl px-5 py-4 text-sm font-semibold tracking-wide text-white shadow-neon transition ${
        disabled || loading ? "opacity-60" : "opacity-100"
      }`}
      style={{
        background:
          "linear-gradient(90deg, rgba(79,70,229,.95), rgba(16,185,129,.95), rgba(34,211,238,.95))",
        backgroundSize: "200% 200%",
      }}
    >
      <span className="absolute inset-0 rounded-2xl opacity-40 blur-[22px]" style={{ background: "inherit" }} aria-hidden="true" />
      <span className="relative">{loading ? "Analyzing…" : "Analyze"}</span>
    </motion.button>
  );
}

