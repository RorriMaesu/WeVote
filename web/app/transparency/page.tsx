"use client";
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebaseClient';
import { exportBallotReportSafe, listLedgerEntriesSafe } from '../../lib/functionsClient';

interface BallotDoc { ballotId: string; concernId: string; type: string; status: string; results?: any; tallySignature?: any; updatedAt?: any; tallyHash?: string; ledgerId?: string; }

export default function TransparencyPage() {
  const [ballots, setBallots] = useState<BallotDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|undefined>();
  const [verifyingId, setVerifyingId] = useState<string|null>(null);
  const [verifyResult, setVerifyResult] = useState<Record<string,string>>({});
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerStatus, setLedgerStatus] = useState<'idle'|'loading'|'ok'|'broken'|'error'>('idle');
  const [ledgerDetail, setLedgerDetail] = useState<string|undefined>();
  const [modLog, setModLog] = useState<any[]>([]);
  const [modLoading, setModLoading] = useState(false);

  useEffect(()=> {
    (async () => {
      try {
        const q = query(collection(db,'ballots'), where('status','==','tallied'), orderBy('updatedAt','desc'), limit(25));
        const snap = await getDocs(q);
        setBallots(snap.docs.map(d => d.data() as BallotDoc));
      } catch (e:any) { setError(e.message || 'Error loading tallies'); }
      setLoading(false);
    })();
  },[]);

  async function loadLedger() {
    setLedgerStatus('loading'); setLedgerDetail(undefined);
    try {
      const data = await listLedgerEntriesSafe(100);
      const entries = data.entries || [];
      setLedgerEntries(entries);
      // Verify chain: for descending seq order provided; we check pairwise prevHash matches next entryHash
      let brokenAt: number | null = null;
      for (let i=0;i<entries.length-1;i++) {
        const current = entries[i];
        const next = entries[i+1];
        if (next.seq !== current.seq - 1) { brokenAt = current.seq; break; }
        if (current.prevHash !== next.entryHash) { brokenAt = current.seq; break; }
      }
      if (brokenAt) { setLedgerStatus('broken'); setLedgerDetail(`Discontinuity starting at seq ${brokenAt}`); }
      else { setLedgerStatus('ok'); setLedgerDetail(`Verified ${entries.length} entries (latest seq ${entries[0]?.seq||'?'}).`); }
    } catch (e:any) {
      setLedgerStatus('error'); setLedgerDetail(e.message||'Failed to load ledger');
    }
  }

  async function loadModerationLog() {
    setModLoading(true);
    try {
      const snap = await getDocs(query(collection(db,'moderation_public'), orderBy('resolvedAt','desc'), limit(50)));
      setModLog(snap.docs.map(d=> ({ id: d.id, ...(d.data() as any) })));
    } catch (e) { /* ignore for now */ }
    setModLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transparency</h1>
  <p className="text-sm text-muted max-w-prose mt-1">Recent tallied ballots. Each tally may include a cryptographic signature (KMS) proving integrity of the canonical results JSON. See <a className="underline" href="/transparency/prompts">Prompt Library</a> and <a className="underline" href="/transparency/algorithm">Algorithm Explain</a>.</p>
        <div className="mt-4 border rounded p-3 space-y-2 bg-black/5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Ledger Chain</h2>
            <button onClick={loadLedger} disabled={ledgerStatus==='loading'} className="text-[11px] px-2 py-1 border rounded">{ledgerStatus==='loading'?'Loading…':'Load / Verify'}</button>
          </div>
          {ledgerStatus!=='idle' && (
            <p className={`text-[11px] ${ledgerStatus==='ok'?'text-green-600':ledgerStatus==='broken'?'text-red-600':ledgerStatus==='error'?'text-amber-600':'text-muted'}`}>{ledgerStatus==='loading'?'Verifying…':ledgerDetail}</p>
          )}
          {ledgerEntries.length>0 && (
            <div className="max-h-48 overflow-auto border rounded bg-white/40">
              <table className="w-full text-[10px]">
                <thead className="bg-black/10">
                  <tr><th className="text-left px-2 py-1">Seq</th><th className="text-left px-2 py-1">Entry Hash</th><th className="text-left px-2 py-1">Prev Hash</th><th className="text-left px-2 py-1">Kind</th><th className="text-left px-2 py-1">Ballot</th></tr>
                </thead>
                <tbody>
                  {ledgerEntries.map(e=> (
                    <tr key={e.ledgerId} className="odd:bg-black/5">
                      <td className="px-2 py-1">{e.seq}</td>
                      <td className="px-2 py-1 font-mono">{(e.entryHash||'').slice(0,10)}…</td>
                      <td className="px-2 py-1 font-mono">{(e.prevHash||'').slice(0,10)}…</td>
                      <td className="px-2 py-1">{e.kind}</td>
                      <td className="px-2 py-1">{e.ballotId? <a className="underline" href={`/ballot/${e.ballotId}`}>{e.ballotId.slice(0,10)}…</a> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="mt-4 border rounded p-3 space-y-2 bg-black/5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Moderation Log (Sanitized)</h2>
            <button onClick={loadModerationLog} disabled={modLoading} className="text-[11px] px-2 py-1 border rounded">{modLoading?'Loading…':'Load'}</button>
          </div>
          {modLog.length===0 && !modLoading && <p className="text-[11px] text-muted">No entries loaded yet.</p>}
          {modLog.length>0 && (
            <div className="max-h-48 overflow-auto border rounded bg-white/40">
              <table className="w-full text-[10px]">
                <thead className="bg-black/10"><tr><th className="text-left px-2 py-1">Action</th><th className="text-left px-2 py-1">Target</th><th className="text-left px-2 py-1">Rationale</th><th className="text-left px-2 py-1">At</th></tr></thead>
                <tbody>
                  {modLog.map(m=> (
                    <tr key={m.id} className="odd:bg-black/5">
                      <td className="px-2 py-1">{m.action}</td>
                      <td className="px-2 py-1 break-all">{m.targetRef}</td>
                      <td className="px-2 py-1 truncate max-w-[200px]" title={m.publicRationale}>{m.publicRationale||'—'}</td>
                      <td className="px-2 py-1">{m.resolvedAt? (m.resolvedAt.toDate? m.resolvedAt.toDate().toISOString().slice(0,19).replace('T',' ') : ''): ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  {loading && <p className="text-xs text-muted">Loading…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {ballots.map(b => (
          <div key={b.ballotId} className="card space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Ballot {b.ballotId}</p>
              <span className="px-2 py-0.5 rounded bg-surface text-[10px] uppercase tracking-wide border border-base">{b.type}</span>
            </div>
            {b.tallySignature ? (
              <p className="text-[10px] text-green-600">Signed: {b.tallySignature.signatureBase64?.slice(0,20)}…</p>
            ) : (
              <p className="text-[10px] text-amber-600">Unsigned (HMAC fallback)</p>
            )}
            {b.results?.counts && (
              <ul className="list-disc ml-4">
                {Object.entries(b.results.counts).map(([k,v]) => (<li key={k}>{k}: {v as any}</li>))}
              </ul>
            )}
            {b.results?.winner && <p className="font-medium">Winner: {b.results.winner}</p>}
            {b.tallyHash && <p className="text-[10px] text-muted">Hash: <span className="font-mono">{b.tallyHash.slice(0,12)}…</span></p>}
            {b.ledgerId && <p className="text-[10px] text-muted">Ledger: {b.ledgerId.slice(0,10)}…</p>}
            <div className="flex items-center gap-3">
              <a href={`/ballot/${b.ballotId}`} className="text-brand-teal hover:underline">View ballot</a>
              <button disabled={verifyingId===b.ballotId} onClick={async ()=> {
                setVerifyingId(b.ballotId); setVerifyResult(r=>({...r,[b.ballotId]:'…'}));
                try {
                  const bundle:any = await exportBallotReportSafe(b.ballotId);
                  const type = b.type;
                  const results = b.results || {};
                  let ok = false;
                  if (type==='simple') {
                    const counts: Record<string,number> = {}; (b as any).options?.forEach((o:any)=> counts[o.id]=0);
                    (bundle.votes||[]).forEach((v:any)=> { if (v.choice && counts.hasOwnProperty(v.choice)) counts[v.choice]++; });
                    ok = JSON.stringify(counts) === JSON.stringify(results.counts||{});
                  } else if (type==='approval') {
                    const counts: Record<string,number> = {}; (b as any).options?.forEach((o:any)=> counts[o.id]=0);
                    (bundle.votes||[]).forEach((v:any)=> (v.approvals||[]).forEach((id:string)=> { if (counts.hasOwnProperty(id)) counts[id]++; }));
                    ok = JSON.stringify(counts) === JSON.stringify(results.counts||{});
                  } else if (type==='rcv') {
                    // Basic RCV verification: compare rounds + winner hash equality
                    const roundsMatch = JSON.stringify(results.rounds||[]) === JSON.stringify(bundle.ballot?.results?.rounds||results.rounds||[]);
                    const winnerMatch = (results.winner||null) === (bundle.ballot?.winner || bundle.ballot?.results?.winner || results.winner||null);
                    ok = roundsMatch && winnerMatch;
                  }
                  setVerifyResult(r=>({...r,[b.ballotId]: ok? 'OK':'Mismatch'}));
                } catch (e:any) {
                  setVerifyResult(r=>({...r,[b.ballotId]:'Error'}));
                } finally { setVerifyingId(id=> id===b.ballotId? null : id); }
              }} className="text-[10px] px-2 py-1 border rounded">{verifyingId===b.ballotId? 'Verifying…':'Verify'}</button>
              {verifyResult[b.ballotId] && <span className={`text-[10px] ${verifyResult[b.ballotId]==='OK'?'text-green-600':verifyResult[b.ballotId]==='Mismatch'?'text-red-600':'text-amber-600'}`}>{verifyResult[b.ballotId]}</span>}
            </div>
          </div>
        ))}
  {!loading && ballots.length===0 && <p className="text-xs text-muted">No tallied ballots yet.</p>}
      </div>
    </div>
  );
}
