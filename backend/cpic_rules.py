from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pandas as pd


SEVERITY_RANK: Dict[str, int] = {
    "none": 0,
    "low": 1,
    "moderate": 2,
    "high": 3,
    "critical": 4,
}


@dataclass(frozen=True)
class CpicDecision:
    drug: str
    primary_gene: str
    phenotype: str
    risk_label: str  # Safe | Adjust Dosage | Toxic | Ineffective | Unknown
    severity: str  # none | low | moderate | high | critical
    clinical_recommendation: str


def load_cpic_rules(csv_path: str | Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df = df.rename(columns={c: c.lower() for c in df.columns})
    required = {"drug", "gene", "phenotype", "risk_label", "severity", "clinical_recommendation"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"cpic_rules.csv missing columns: {sorted(missing)}")

    # Normalize
    df["drug"] = df["drug"].astype(str).str.strip().str.upper()
    df["gene"] = df["gene"].astype(str).str.strip().str.upper()
    df["phenotype"] = df["phenotype"].astype(str).str.strip()
    df["risk_label"] = df["risk_label"].astype(str).str.strip()
    df["severity"] = df["severity"].astype(str).str.strip().str.lower()
    df["clinical_recommendation"] = df["clinical_recommendation"].astype(str).str.strip()
    return df


def _pick_best(rows: pd.DataFrame) -> Optional[pd.Series]:
    if rows.empty:
        return None
    ranked = rows.copy()
    ranked["_sev_rank"] = ranked["severity"].map(lambda s: SEVERITY_RANK.get(str(s).lower(), -1))
    ranked = ranked.sort_values(by=["_sev_rank"], ascending=[False])
    return ranked.iloc[0]


def decide(drug: str, gene_to_phenotype: Dict[str, str], rules_df: pd.DataFrame) -> CpicDecision:
    drug_u = (drug or "").strip().upper()
    if not drug_u:
        return CpicDecision(
            drug="",
            primary_gene="",
            phenotype="Unknown",
            risk_label="Unknown",
            severity="none",
            clinical_recommendation="No drug provided.",
        )

    drug_rules = rules_df[rules_df["drug"] == drug_u]
    if drug_rules.empty:
        return CpicDecision(
            drug=drug_u,
            primary_gene="",
            phenotype="Unknown",
            risk_label="Unknown",
            severity="none",
            clinical_recommendation="No CPIC rule available for this drug in the configured dataset.",
        )

    candidates: List[Tuple[int, pd.Series]] = []
    for gene, phenotype in gene_to_phenotype.items():
        rows = drug_rules[(drug_rules["gene"] == gene) & (drug_rules["phenotype"] == phenotype)]
        best = _pick_best(rows)
        if best is not None:
            candidates.append((SEVERITY_RANK.get(str(best["severity"]).lower(), 0), best))

    if not candidates:
        # Try an explicit Unknown/any phenotype fall-through if present
        rows = drug_rules[drug_rules["phenotype"].str.lower() == "unknown"]
        best = _pick_best(rows)
        if best is not None:
            return CpicDecision(
                drug=drug_u,
                primary_gene=str(best["gene"]),
                phenotype="Unknown",
                risk_label=str(best["risk_label"]),
                severity=str(best["severity"]),
                clinical_recommendation=str(best["clinical_recommendation"]),
            )

        return CpicDecision(
            drug=drug_u,
            primary_gene="",
            phenotype="Unknown",
            risk_label="Unknown",
            severity="none",
            clinical_recommendation="No matching CPIC rule for the detected pharmacogenomic phenotype(s) in the configured dataset.",
        )

    candidates.sort(key=lambda t: t[0], reverse=True)
    best = candidates[0][1]
    return CpicDecision(
        drug=drug_u,
        primary_gene=str(best["gene"]),
        phenotype=str(best["phenotype"]),
        risk_label=str(best["risk_label"]),
        severity=str(best["severity"]),
        clinical_recommendation=str(best["clinical_recommendation"]),
    )

