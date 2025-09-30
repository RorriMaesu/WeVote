"use client";
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebaseClient';

interface LedgerEntry { seq: number; prevHash: string|null; entryHash: string; canonical: string; signature?: { signatureBase64: string; algo: string }; }

export default function VerifyPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [status, setStatus] = useState<string>('loading');
  const [chainValid, setChainValid] = useState<boolean|null>(null);
  const [sigChecks, setSigChecks] = useState<{ seq: number; ok: boolean; reason?: string }[]>([]);

  useEffect(()=> { (async () => {
    try {
      const qRef = query(collection(db,'transparency_ledger'), orderBy('seq','asc'));
      const snap = await getDocs(qRef);
      const list = snap.docs.map(d=> d.data() as any) as LedgerEntry[];
      setEntries(list);
      setStatus('verifying');
    } catch (e:any) {
      setStatus('error: ' + (e.message||'unknown'));
    }
  })(); },[]);

  useEffect(()=> { if (status !== 'verifying') return; (async () => {
    if (!entries.length) { setChainValid(true); setStatus('done'); return; }
    // Hash validation
    const subtle = crypto.subtle;
    let ok = true; let prev: string|null = null; const sigResults: { seq:number; ok:boolean; reason?:string }[] = [];
    // Load public key (optional)
    let pubKey: CryptoKey | null = null;
    try {
      const pemResp = await fetch('/signing-key.pem');
      if (pemResp.ok) {
        const pemText = await pemResp.text();
        const b64 = pemText.replace(/-----BEGIN PUBLIC KEY-----/,'').replace(/-----END PUBLIC KEY-----/,'').replace(/\s+/g,'');
        const der = Uint8Array.from(atob(b64), c=>c.charCodeAt(0));
        pubKey = await subtle.importKey('spki', der.buffer, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      }
    } catch { /* ignore */ }
    for (const entry of entries) {
      const canonicalBytes = new TextEncoder().encode(entry.canonical);
      const hashBuf = await crypto.subtle.digest('SHA-256', canonicalBytes);
      const hashHex = Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');
      if (hashHex !== entry.entryHash) { ok = false; break; }
      if (entry.prevHash !== prev) { ok = false; break; }
      // Signature check (optional)
      if (pubKey && entry.signature?.signatureBase64) {
        try {
          const der = Uint8Array.from(atob(entry.signature.signatureBase64), c=> c.charCodeAt(0));
          // Convert DER ECDSA to raw (r||s)
          const raw = derToRawEcdsa(der);
          const verified = await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pubKey, raw, canonicalBytes);
          sigResults.push({ seq: entry.seq, ok: verified, reason: verified ? undefined : 'bad signature' });
        } catch (e:any) {
          sigResults.push({ seq: entry.seq, ok: false, reason: 'sig parse fail' });
        }
      }
      prev = entry.entryHash;
    }
    setSigChecks(sigResults);
    setChainValid(ok);
    setStatus('done');
  })(); }, [status, entries]);

  return <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-semibold">Verify Ledger</h1>
  <p className="text-sm text-muted max-w-prose mt-1">Client-side verification of the transparency ledger: hash chain integrity and optional signature validation if a public key is published.</p>
    </div>
  {status !== 'done' && <p className="text-xs text-muted">{status}…</p>}
    {status === 'done' && chainValid !== null && (
      <div className={chainValid ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
        Chain integrity: {chainValid ? 'VALID' : 'INVALID'} (entries: {entries.length})
      </div>
    )}
    {sigChecks.length > 0 && <div className="text-xs"><p className="font-medium">Signature checks:</p>
      <ul className="list-disc ml-4">
        {sigChecks.map(s=> <li key={s.seq}>#{s.seq}: {s.ok ? 'ok' : 'FAIL'} {s.reason && <span className="text-red-600">({s.reason})</span>}</li>)}
      </ul>
    </div>}
  <div className="overflow-x-auto text-[10px] border border-base rounded p-2 bg-surface space-y-1 max-h-96">
      {entries.map(e=> <div key={e.seq} className="font-mono break-all">
        <span className="font-semibold">[{e.seq}]</span> hash={e.entryHash.slice(0,24)} prev={e.prevHash?.slice(0,16)||'null'} {e.signature? '🗲' : ''}
      </div>)}
      {!entries.length && status==='done' && <p>No entries.</p>}
    </div>
  <p className="text-xs text-muted">Prototype: Do not rely solely on this for high-stakes verification yet.</p>
  </div>;
}

// Minimal DER to raw ECDSA converter for P-256
function derToRawEcdsa(der: Uint8Array): ArrayBuffer {
  // Very small ASN.1 parser (expects: 30 len 02 rLen r 02 sLen s)
  if (der[0] !== 0x30) throw new Error('Invalid DER');
  let offset = 2; // skip SEQ + len
  if (der[1] & 0x80) { // long-form length
    const lbytes = der[1] & 0x7f; offset = 2 + lbytes; // skip for simplicity (assumes short)
  }
  if (der[offset-1] !== 0x02) { /* continue anyway */ }
  if (der[offset] !== 0x02) throw new Error('Invalid DER int');
  let rLen = der[offset+1];
  let rOff = offset + 2;
  if (der[rOff] === 0x00) { rOff++; rLen--; }
  const r = der.slice(rOff, rOff + rLen);
  let sIdx = rOff + rLen;
  if (der[sIdx] !== 0x02) throw new Error('Invalid DER int (s)');
  let sLen = der[sIdx+1];
  let sOff = sIdx + 2;
  if (der[sOff] === 0x00) { sOff++; sLen--; }
  const s = der.slice(sOff, sOff + sLen);
  const raw = new Uint8Array(64);
  raw.set(r.length < 32 ? concatLeftPad(r,32) : r.slice(-32), 0);
  raw.set(s.length < 32 ? concatLeftPad(s,32) : s.slice(-32), 32);
  return raw.buffer;
}

function concatLeftPad(src: Uint8Array, len: number) {
  const out = new Uint8Array(len);
  out.set(src, len - src.length);
  return out;
}
