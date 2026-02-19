import Editor from "@monaco-editor/react";

export default function JsonViewer({ value }) {
  const json = JSON.stringify(value ?? {}, null, 2);

  return (
    <div className="glass neon-edge overflow-hidden rounded-2xl">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="text-sm font-semibold text-white">JSON Report</div>
        <div className="mt-1 text-xs text-white/60">Schema-locked output (read-only)</div>
      </div>
      <div className="h-[520px]">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={json}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            renderLineHighlight: "all",
            automaticLayout: true,
          }}
          theme="vs-dark"
        />
      </div>
    </div>
  );
}

