from __future__ import annotations

import os
from dotenv import load_dotenv
load_dotenv()
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from cpic_rules import decide, load_cpic_rules
from llm import generate_explanation
from phenotype import load_diplotype_phenotype_map, phenotype_for
from vcf_parser import ALLOWED_GENES, parse_vcf


APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_drugs(drug_raw: str) -> List[str]:
    if not drug_raw:
        return []
    parts = [p.strip() for p in drug_raw.replace(";", ",").split(",")]
    drugs = []
    for p in parts:
        if not p:
            continue
        drugs.append(p.upper())
    # stable unique
    seen = set()
    out = []
    for d in drugs:
        if d not in seen:
            seen.add(d)
            out.append(d)
    return out


def _build_diplotype(stars: List[str]) -> str:
    cleaned: List[str] = []
    for s in stars:
        if not s:
            continue
        s = str(s).strip().upper().replace(" ", "")
        if not s:
            continue
        if "/" in s and s.count("/") == 1:
            left, right = s.split("/", 1)
            return f"{_normalize_star(left)}/{_normalize_star(right)}"
        cleaned.append(_normalize_star(s))

    uniq: List[str] = []
    for s in cleaned:
        if s not in uniq:
            uniq.append(s)
    if len(uniq) >= 2:
        return f"{uniq[0]}/{uniq[1]}"
    if len(uniq) == 1:
        return f"{uniq[0]}/{uniq[0]}"
    return "UNKNOWN"


def _normalize_star(s: str) -> str:
    s = (s or "").strip().upper()
    if not s:
        return ""
    if not s.startswith("*"):
        # tolerate "1" -> "*1"
        if s[0].isdigit():
            return f"*{s}"
    return s


def _confidence(phenotype: str, risk_label: str, vcf_ok: bool) -> float:
    if not vcf_ok:
        return 0.0
    if phenotype == "Unknown":
        return 0.35 if risk_label == "Unknown" else 0.5
    if risk_label == "Unknown":
        return 0.6
    return 0.9


def _empty_report(patient_id: str, drug: str) -> Dict[str, Any]:
    # Must ensure no missing keys.
    return {
        "patient_id": patient_id,
        "drug": drug,
        "timestamp": _now_iso(),
        "risk_assessment": {"risk_label": "Unknown", "confidence_score": 0.0, "severity": "none"},
        "pharmacogenomic_profile": {
            "primary_gene": "",
            "diplotype": "UNKNOWN",
            "phenotype": "Unknown",
            "detected_variants": [],
        },
        "clinical_recommendation": "",
        "llm_generated_explanation": "",
        "quality_metrics": {
            "vcf_parsing_success": False,
            "variants_parsed_count": 0,
            "genes_detected": [],
            "processing_warnings": [],
            "llm_used": False,
        },
    }


app = FastAPI(title="PharmaGuard", version="1.0.0")

cors_origins = [o.strip() for o in os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(vcf_file: UploadFile = File(...), drug_name: str = Form(...)) -> JSONResponse:
    patient_id = str(uuid.uuid4())
    drugs = _parse_drugs(drug_name)
    if not drugs:
        return JSONResponse(status_code=400, content={"error": "drug_name is required (single or comma-separated)."})

    if not vcf_file.filename or not (
        vcf_file.filename.lower().endswith(".vcf") or vcf_file.filename.lower().endswith(".vcf.gz")
    ):
        return JSONResponse(status_code=400, content={"error": "Only .vcf or .vcf.gz uploads are supported."})

    tmp_path = None
    try:
        diplotype_map = load_diplotype_phenotype_map(DATA_DIR / "diplotypes.csv")
        rules_df = load_cpic_rules(DATA_DIR / "cpic_rules.csv")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".vcf") as tmp:
            tmp_path = tmp.name
            content = await vcf_file.read()
            tmp.write(content)

        vcf_ok = True
        warnings: List[str] = []
        by_gene = parse_vcf(tmp_path)
        genes_detected = sorted(by_gene.keys())

        gene_profile: Dict[str, Dict[str, Any]] = {}
        gene_to_phenotype: Dict[str, str] = {}
        for gene, variants in by_gene.items():
            stars = [v.star for v in variants if v.star]
            diplotype = _build_diplotype([s for s in stars if s])
            pheno = phenotype_for(gene, diplotype, diplotype_map)
            gene_to_phenotype[gene] = pheno.phenotype
            gene_profile[gene] = {
                "gene": gene,
                "diplotype": pheno.diplotype,
                "phenotype": pheno.phenotype,
                "detected_variants": [v.to_json() for v in variants],
            }

        # For each drug: apply rules (never LLM), then generate explanation (LLM only).
        reports: List[Dict[str, Any]] = []
        total_variants = sum(len(v) for v in by_gene.values())

        for drug in drugs:
            report = _empty_report(patient_id, drug)
            report["timestamp"] = _now_iso()

            decision = decide(drug, gene_to_phenotype, rules_df)

            # Primary gene profile (if known), else choose first detected gene (if any)
            primary_gene = decision.primary_gene or (sorted(genes_detected)[0] if genes_detected else "")
            primary = gene_profile.get(primary_gene, None)

            report["risk_assessment"] = {
                "risk_label": decision.risk_label,
                "confidence_score": _confidence(
                    phenotype=(primary.get("phenotype") if primary else "Unknown"),
                    risk_label=decision.risk_label,
                    vcf_ok=vcf_ok,
                ),
                "severity": decision.severity,
            }

            report["pharmacogenomic_profile"] = {
                "primary_gene": primary_gene,
                "diplotype": (primary.get("diplotype") if primary else "UNKNOWN"),
                "phenotype": (primary.get("phenotype") if primary else "Unknown"),
                "detected_variants": (primary.get("detected_variants") if primary else []),
            }

            report["clinical_recommendation"] = decision.clinical_recommendation

            llm_text, llm_meta = generate_explanation(report)
            report["llm_generated_explanation"] = llm_text

            report["quality_metrics"] = {
                "vcf_parsing_success": True,
                "variants_parsed_count": int(total_variants),
                "genes_detected": genes_detected,
                "processing_warnings": warnings,
                **llm_meta,
            }

            reports.append(report)

        return JSONResponse(status_code=200, content=reports if len(reports) > 1 else reports[0])
    except Exception as e:  # noqa: BLE001
        # Always return a complete schema on failure for each requested drug.
        # Return 200 so the frontend can still render the schema-locked report
        # (with the failure captured in quality_metrics.processing_warnings).
        warnings = [f"analysis_error: {e}"]
        failed: List[Dict[str, Any]] = []
        for drug in drugs:
            report = _empty_report(patient_id, drug)
            report["quality_metrics"]["processing_warnings"] = warnings
            failed.append(report)
        return JSONResponse(status_code=200, content=failed if len(failed) > 1 else failed[0])
    finally:
        if tmp_path:
            try:
                Path(tmp_path).unlink(missing_ok=True)
            except Exception:
                pass

