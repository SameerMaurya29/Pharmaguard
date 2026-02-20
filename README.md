# PharmaGuard AI (Pharmacogenomics Web App)

AI-powered precision medicine system that analyzes VCF files and drug names to produce **CPIC-aligned** pharmacogenomic risk reports with **LLM explanations**.

## Architecture

- **Frontend** (`/frontend`): React + Vite + Tailwind + Framer Motion + Monaco JSON viewer
- **Backend** (`/backend`): FastAPI + pysam + pandas; rule engine driven by CSVs
- **Medical logic**:
  - VCF parsing extracts `rsid` (`record.id`), `gene` (`INFO.GENE`), `STAR` allele (`INFO.STAR`)
  - Only genes processed: `CYP2D6`, `CYP2C19`, `CYP2C9`, `SLCO1B1`, `TPMT`, `DPYD`
  - Diplotype → phenotype is mapped via `/backend/data/diplotypes.csv`
  - CPIC drug rules are applied via `/backend/data/cpic_rules.csv`
  - **OpenAI is used only to generate explanations**; risk/severity/recommendations come strictly from CSV rules

## Tech stack

- **Backend**: Python, FastAPI, pysam, pandas, openai, python-multipart, uvicorn
- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, Monaco JSON viewer

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp env.example .env
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Health check: `GET http://localhost:8000/health`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173` and proxies `/api/*` to the backend.

## API docs

### `POST /analyze`

**Form-data**

- `vcf_file`: `.vcf` file upload
- `drug_name`: drug name (single or comma-separated)

**Response**

- Returns **one** report object if one drug is provided, otherwise an **array** of report objects.
- Each report strictly follows the schema:

```json
{
  "patient_id": "...",
  "drug": "CODEINE",
  "timestamp": "...",
  "risk_assessment": {
    "risk_label": "Safe | Adjust Dosage | Toxic | Ineffective | Unknown",
    "confidence_score": 0.0,
    "severity": "none | low | moderate | high | critical"
  },
  "pharmacogenomic_profile": {
    "primary_gene": "CYP2D6",
    "diplotype": "*1/*2",
    "phenotype": "IM",
    "detected_variants": []
  },
  "clinical_recommendation": "...",
  "llm_generated_explanation": "...",
  "quality_metrics": {
    "vcf_parsing_success": true,
    "variants_parsed_count": 0,
    "genes_detected": [],
    "processing_warnings": [],
    "llm_used": true
  }
}
```

## Usage

1. Start backend + frontend.
2. Upload a VCF with `INFO.GENE` and `INFO.STAR` annotations for supported genes.
3. Select one or more drugs and click **Analyze**.
4. Download or copy the schema-locked JSON report.

## Deployment

### Frontend (Vercel)

- Project root: `frontend`
- Build command: `npm run build`
- Output: `dist`
- Env: `VITE_API_BASE_URL` (set to your backend base URL, e.g. `https://your-backend.onrender.com`)

### Backend (Render)

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL` (optional)
  - `CORS_ALLOW_ORIGINS` (comma-separated; include your Vercel URL)

## Team Members 
Sameer Maurya , Vikrant , Shreyansh , Shreyash

### Project Live link
https://pharmaguard121.netlify.app/

