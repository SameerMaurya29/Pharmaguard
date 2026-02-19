from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

import os
from typing import Any, Dict, Tuple
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_explanation(report: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
    if not os.getenv("GROQ_API_KEY"):
        return (
            "LLM explanation unavailable: GROQ_API_KEY not configured.",
            {"llm_used": False, "error": "missing_groq_api_key"},
        )

    system = (
        "You are a pharmacogenomics clinical explanation assistant.\n"
        "You MUST NOT change any risk classification, severity, or recommendation.\n"
        "You only explain the biological mechanism (gene/phenotype), and the clinical impact for the given drug.\n"
        "Write concise, clinician-friendly text. Do NOT provide dosing numbers.\n"
    )

    payload = {
        "drug": report.get("drug"),
        "risk_label": report.get("risk_assessment", {}).get("risk_label"),
        "severity": report.get("risk_assessment", {}).get("severity"),
        "primary_gene": report.get("pharmacogenomic_profile", {}).get("primary_gene"),
        "diplotype": report.get("pharmacogenomic_profile", {}).get("diplotype"),
        "phenotype": report.get("pharmacogenomic_profile", {}).get("phenotype"),
        "clinical_recommendation": report.get("clinical_recommendation"),
    }

    prompt = f"{system}\nRESULT_JSON:\n{payload}"

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=300,
        )
        text = completion.choices[0].message.content.strip()
        return (
            text,
            {"llm_used": True, "model": "llama-3.1-8b-instant"},
        )
    except Exception as e:
        return (
            "LLM explanation unavailable due to an error while generating text.",
            {"llm_used": False, "error": str(e)},
        )