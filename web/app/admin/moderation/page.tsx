"use client";
import { useEffect, useState } from 'react';
import { auth } from '../../../lib/firebaseClient';
import { reportContentSafe } from '../../../lib/functionsClient';

// We will call the HTTP endpoints manually (simpler than expanding functionsClient for now)
async function callFn(path: string, payload: any) {
  const user = auth.currentUser; if (!user) throw new Error('Not signed in');
  const token = await user.getIdToken();
  const resp = await fetch(`https://us-central1-wevote-5400a.cloudfunctions.net/${path}`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  const json = await resp.json().catch(()=>({}));
  if (!resp.ok) throw new Error(json.error || resp.statusText);
  return json;
}

export default function ModerationAdminPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string|undefined>();

  async function load() {
    setLoading(true);
    try {
      const json = await callFn('listOpenReportsHttp', {});
      setReports(json.reports || []);
    } catch (e: any) { setMessage(e.message||'Error loading'); }
    setLoading(false);
  }

  useEffect(()=> { load(); }, []);

  async function resolve(reportId: string, action: string) {
    try { await callFn('resolveReportHttp', { reportId, action }); setMessage('Resolved'); await load(); } catch(e:any){ setMessage(e.message||'Resolve failed'); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Moderation Queue</h1>
        <p className="text-sm text-muted">Open user reports pending review.</p>
      </div>
      {loading && <p className="text-xs text-muted">Loading…</p>}
      {!loading && reports.length===0 && <p className="text-xs text-muted">No open reports.</p>}
      <div className="space-y-3">
        {reports.map(r=> (
          <div key={r.reportId} className="border rounded p-3 bg-black/5 flex flex-col gap-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-mono">{r.reportId}</span>
              <span className="text-[10px] uppercase tracking-wide">{r.reason}</span>
            </div>
            <p className="text-[11px] break-all">Target: {r.targetRef}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {['none','flag','remove','escalate'].map(a=> <button key={a} onClick={()=> resolve(r.reportId, a)} className="px-2 py-1 border rounded text-[11px]" >{a}</button>)}
            </div>
          </div>
        ))}
      </div>
      {message && <p className="text-[11px] text-muted">{message}</p>}
      <button onClick={load} className="btn-secondary text-xs">Refresh</button>
    </div>
  );
}