export async function analyzeVcf({ file, drugs, signal }) {
  const base = import.meta.env.VITE_API_BASE_URL || "/api";
  const url = `${base}/analyze`;

  const form = new FormData();
  form.append("vcf_file", file);
  form.append("drug_name", drugs.join(","));

  const res = await fetch(url, { method: "POST", body: form, signal });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.error || "Request failed.";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return Array.isArray(data) ? data : [data];
}

