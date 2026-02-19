import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import AnalyzeButton from "./components/AnalyzeButton.jsx";
import CopyButton from "./components/CopyButton.jsx";
import DnaParticles from "./components/DnaParticles.jsx";
import DownloadButton from "./components/DownloadButton.jsx";
import DrugSelector from "./components/DrugSelector.jsx";
import Hero from "./components/Hero.jsx";
import JsonViewer from "./components/JsonViewer.jsx";
import Loader from "./components/Loader.jsx";
import ProfilePanel from "./components/ProfilePanel.jsx";
import RiskPanel from "./components/RiskPanel.jsx";
import UploadCard from "./components/UploadCard.jsx";
import { analyzeVcf } from "./lib/api.js";
import { validateReportShape } from "./lib/schema.js";

function ErrorBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="glass neon-edge mx-auto mt-6 max-w-6xl rounded-2xl border-red-200/20 bg-red-400/10 px-5 py-4 text-sm text-red-50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">Error</div>
          <div className="mt-1 text-red-50/80">{message}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:border-red-200/30"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [file, setFile] = useState(null);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [reports, setReports] = useState([]);
  const [activeDrug, setActiveDrug] = useState("");
  const abortRef = useRef(null);

  const activeReport = useMemo(() => {
    if (!reports.length) return null;
    if (!activeDrug) return reports[0];
    return reports.find((r) => r.drug === activeDrug) || reports[0];
  }, [reports, activeDrug]);

  const canAnalyze = !!file && drugs.length > 0 && !loading;

  const run = async () => {
    setError("");
    setReports([]);
    setActiveDrug("");
    if (!file) {
      toast.error("Please upload a .vcf file.");
      return;
    }
    if (!drugs.length) {
      toast.error("Select at least one drug.");
      return;
    }

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setStep(0);
      const stepTimer = window.setInterval(() => setStep((s) => (s < 3 ? s + 1 : s)), 900);

      const out = await analyzeVcf({ file, drugs, signal: controller.signal });

      window.clearInterval(stepTimer);
      setStep(3);

      // Validate required keys so UI never breaks silently.
      for (const r of out) {
        const v = validateReportShape(r);
        if (!v.ok) {
          throw new Error(`Backend response missing keys: ${v.missing.join(", ")}`);
        }
      }

      setReports(out);
      setActiveDrug(out[0]?.drug || "");
      toast.success("Report generated.");
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (e) {
      const msg = e?.name === "AbortError" ? "Request cancelled." : e?.message || "Failed to analyze.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-aurora text-white">
      <DnaParticles />
      <div className="noise" />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(10, 12, 26, 0.86)",
            color: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
          },
        }}
      />

      <Hero />

      <ErrorBanner message={error} onClose={() => setError("")} />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-16 pt-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="space-y-4">
            <UploadCard
              file={file}
              onFile={(f) => {
                setFile(f);
                toast.success("VCF loaded.");
              }}
              onError={(m) => toast.error(m)}
            />
            <DrugSelector value={drugs} onChange={setDrugs} />
            <AnalyzeButton disabled={!canAnalyze} loading={loading} onClick={run} />
            {loading && (
              <button
                type="button"
                onClick={() => abortRef.current?.abort?.()}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white/80 hover:border-red-200/25"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="mt-6">
            <AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                  <Loader stepIndex={step} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!reports.length ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass neon-edge rounded-2xl p-8"
              >
                <div className="text-sm font-semibold text-white">Awaiting analysis</div>
                <div className="mt-2 text-sm leading-relaxed text-white/70">
                  Upload a VCF and select drug(s) to generate CPIC-aligned pharmacogenomic risk reports. The output JSON is schema-locked,
                  and the LLM is used only to explain the already-determined risk.
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {reports.length > 1 && (
                  <div className="glass neon-edge flex flex-wrap items-center gap-2 rounded-2xl p-4">
                    {reports.map((r) => (
                      <button
                        key={r.drug}
                        type="button"
                        onClick={() => setActiveDrug(r.drug)}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                          activeDrug === r.drug
                            ? "border-cyan-200/30 bg-cyan-200/10 text-white"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-cyan-200/20 hover:text-white"
                        }`}
                      >
                        {r.drug}
                      </button>
                    ))}
                  </div>
                )}

                <RiskPanel report={activeReport} />

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <ProfilePanel report={activeReport} />
                  <div className="glass neon-edge rounded-2xl p-6">
                    <div className="text-xs text-white/60">LLM Explanation</div>
                    <div className="mt-2 text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
                      {activeReport?.llm_generated_explanation || "—"}
                    </div>
                    <div className="mt-4 text-[11px] text-white/55">
                      quality_metrics.vcf_parsing_success:{" "}
                      <span className="text-white/75">{String(activeReport?.quality_metrics?.vcf_parsing_success)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <DownloadButton
                    filename={`pharmaguard-${activeReport?.patient_id || "patient"}-${(activeReport?.drug || "drug")
                      .toLowerCase()
                      .replaceAll(" ", "-")}.json`}
                    data={activeReport}
                  />
                  <CopyButton
                    text={JSON.stringify(activeReport ?? {}, null, 2)}
                    onCopied={() => toast.success("Copied to clipboard.")}
                  />
                </div>

                <JsonViewer value={activeReport} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-white/45">
        PharmaGuard AI • Educational demo. Always consult clinical guidelines and local policy.
      </footer>
    </div>
  );
}

