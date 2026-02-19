from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence

import pysam


ALLOWED_GENES = {"CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"}


@dataclass(frozen=True)
class DetectedVariant:
    rsid: Optional[str]
    gene: str
    star: Optional[str]
    chrom: str
    pos: int
    ref: str
    alt: str

    def to_json(self) -> Dict[str, Any]:
        return {
            "rsid": self.rsid,
            "gene": self.gene,
            "star": self.star,
            "chrom": self.chrom,
            "pos": self.pos,
            "ref": self.ref,
            "alt": self.alt,
        }


def _info_str(info: Any, key: str) -> Optional[str]:
    if info is None:
        return None
    if key not in info:
        return None
    val = info.get(key)
    if val is None:
        return None
    if isinstance(val, (list, tuple)):
        if not val:
            return None
        # choose first for deterministic behavior
        val = val[0]
    return str(val)


def parse_vcf(path: str) -> Dict[str, List[DetectedVariant]]:
    """
    Parses a VCF file using pysam and extracts:
    - rsid (record.id)
    - gene (INFO.GENE)
    - star allele (INFO.STAR)
    Only variants with gene in ALLOWED_GENES are returned.
    """
    vcf = pysam.VariantFile(path)
    by_gene: Dict[str, List[DetectedVariant]] = {g: [] for g in sorted(ALLOWED_GENES)}

    # NOTE: vcf.fetch() typically requires a tabix index; uploads are often unindexed.
    # Iterating the VariantFile works without an index for plain .vcf inputs.
    for rec in vcf:
        gene = _info_str(rec.info, "GENE")
        if not gene or gene not in ALLOWED_GENES:
            continue

        star = _info_str(rec.info, "STAR")

        alts: Sequence[str] = rec.alts or ()
        alt = str(alts[0]) if alts else ""

        by_gene[gene].append(
            DetectedVariant(
                rsid=str(rec.id) if rec.id else None,
                gene=gene,
                star=str(star) if star else None,
                chrom=str(rec.chrom),
                pos=int(rec.pos),
                ref=str(rec.ref),
                alt=alt,
            )
        )

    return {g: v for g, v in by_gene.items() if v}

