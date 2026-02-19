import { motion } from "framer-motion";

export default function DownloadButton({ filename = "pharmaguard-report.json", data }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => {
        const blob = new Blob([JSON.stringify(data ?? {}, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }}
      className="glass neon-edge rounded-2xl px-4 py-3 text-sm font-semibold text-white/90 hover:border-cyan-200/30"
    >
      Download
    </motion.button>
  );
}

