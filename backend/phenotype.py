from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Tuple

import pandas as pd


@dataclass(frozen=True)
class PhenotypeResult:
    gene: str
    diplotype: str
    phenotype: str  # PM, IM, NM, RM, URM, Unknown


def _normalize_diplotype(diplotype: str) -> str:
    s = (diplotype or "").strip().upper().replace(" ", "")
    if not s:
        return "UNKNOWN"
    # Normalize separators
    s = s.replace("|", "/")
    if "/" not in s:
        # if user stored as "*1*2", etc. keep as-is; mapping must match CSV
        return s
    left, right = s.split("/", 1)
    return f"{left}/{right}"


def load_diplotype_phenotype_map(csv_path: str | Path) -> Dict[Tuple[str, str], str]:
    df = pd.read_csv(csv_path)
    required = {"gene", "diplotype", "phenotype"}
    missing = required - set(df.columns.str.lower())
    if missing:
        # tolerate different casing by remapping
        cols = {c.lower(): c for c in df.columns}
        if missing - set(cols.keys()):
            raise ValueError(f"diplotypes.csv missing columns: {sorted(missing)}")
        df = df.rename(columns={cols["gene"]: "gene", cols["diplotype"]: "diplotype", cols["phenotype"]: "phenotype"})
    else:
        df = df.rename(columns={c: c.lower() for c in df.columns})

    m: Dict[Tuple[str, str], str] = {}
    for _, row in df.iterrows():
        gene = str(row["gene"]).strip().upper()
        diplotype = _normalize_diplotype(str(row["diplotype"]))
        phenotype = str(row["phenotype"]).strip()
        m[(gene, diplotype)] = phenotype
    return m


def phenotype_for(gene: str, diplotype: str, mapping: Dict[Tuple[str, str], str]) -> PhenotypeResult:
    gene_u = (gene or "").strip().upper()
    dip = _normalize_diplotype(diplotype)
    phenotype = mapping.get((gene_u, dip), "Unknown")
    return PhenotypeResult(gene=gene_u, diplotype=dip, phenotype=phenotype)

