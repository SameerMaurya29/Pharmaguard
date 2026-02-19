import { motion } from "framer-motion";

export default function CopyButton({ text, onCopied }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={async () => {
        await navigator.clipboard.writeText(text || "");
        onCopied?.();
      }}
      className="glass neon-edge rounded-2xl px-4 py-3 text-sm font-semibold text-white/90 hover:border-cyan-200/30"
    >
      Copy JSON
    </motion.button>
  );
}

