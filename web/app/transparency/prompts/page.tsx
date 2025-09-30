"use client";
import { useEffect, useState } from 'react';
import { getPromptLibrary } from '../../../../packages/shared/prompts';

export default function PromptLibraryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  useEffect(()=> { setEntries(getPromptLibrary()); }, []);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Model & Prompt Library</h1>
        <p className="text-sm text-muted max-w-prose mt-1">Canonical prompt templates used for LLM assisted drafting. Compare templateHash + templateVersion in draft provenance.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {entries.map(e => (
          <div key={e.id} className="card space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{e.id}</p>
              <span className="px-2 py-0.5 rounded bg-surface text-[10px] border">v{e.version}</span>
            </div>
            <p className="text-[11px] text-muted">Purpose: {e.purpose}</p>
            <p className="text-[10px] font-mono break-all">templateHash: {e.templateHash}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] underline">Preview</summary>
              <pre className="mt-2 p-2 bg-black/5 rounded text-[10px] whitespace-pre-wrap">{e.preview}</pre>
            </details>
          </div>
        ))}
      </div>
      {entries.length===0 && <p className="text-xs text-muted">No prompt entries.</p>}
      <p className="text-[11px] text-muted">Modifying a live template requires a version bump.</p>
    </div>
  );
}
