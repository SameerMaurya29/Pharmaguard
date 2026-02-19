import { motion } from "framer-motion";

const STEPS = ["Parsing VCF", "Detecting Variants", "Applying CPIC", "Generating Explanation"];

export default function Loader({ stepIndex = 0 }) {
  return (
    <div className="glass neon-edge w-full rounded-2xl p-6">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14">
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.6, ease: "linear" }}
            style={{
              background:
                "conic-gradient(from 0deg, rgba(34,211,238,.0), rgba(34,211,238,.7), rgba(16,185,129,.6), rgba(79,70,229,.7), rgba(34,211,238,.0))",
              filter: "blur(0.2px)",
            }}
          />
          <div className="absolute inset-[6px] rounded-xl bg-[#070a18]" />
          <motion.div
            className="absolute left-1/2 top-1/2 h-7 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/70"
            animate={{ rotate: [0, 180, 360] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            style={{ transformOrigin: "50% 50%" }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 h-7 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-200/60"
            animate={{ rotate: [90, 270, 450] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            style={{ transformOrigin: "50% 50%" }}
          />
        </div>

        <div className="flex-1">
          <div className="text-sm font-semibold text-white">DNA Helix</div>
          <div className="mt-1 text-xs text-white/60">Pipeline running…</div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {STEPS.map((s, i) => {
          const active = i === stepIndex;
          const done = i < stepIndex;
          return (
            <div key={s} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs text-white/75">{s}</div>
              <div className="text-[11px]">
                {done ? (
                  <span className="text-emerald-200/90">Done</span>
                ) : active ? (
                  <motion.span
                    className="text-cyan-200/90"
                    animate={{ opacity: [0.45, 1, 0.45] }}
                    transition={{ repeat: Infinity, duration: 1.1 }}
                  >
                    Running
                  </motion.span>
                ) : (
                  <span className="text-white/45">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

