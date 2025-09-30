"use client";
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseClient';
import { setDelegationSafe } from '../../lib/functionsClient';

export default function ProfilePage() {
  const [delegations, setDelegations] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [delegateUid, setDelegateUid] = useState('');
  const [msg, setMsg] = useState<string|undefined>();

  async function load() {
    const u = auth.currentUser; if (!u) { setLoading(false); return; }
    const snap = await getDoc(doc(db,'users',u.uid));
    if (snap.exists()) {
      const data: any = snap.data();
      setDelegations(data.delegations || {});
    }
    setLoading(false);
  }
  useEffect(()=> { load(); },[]);

  async function save() {
    setMsg(undefined);
    if (!topic) { setMsg('Topic required'); return; }
    try {
      await setDelegationSafe({ topic: topic.trim(), delegateUid: delegateUid.trim() || null });
      setMsg('Saved'); setTopic(''); setDelegateUid(''); await load();
    } catch (e:any) { setMsg(e.message||'Failed'); }
  }
  async function clear(t: string) {
    try { await setDelegationSafe({ topic: t.replace(/^topic:/,'').trim(), delegateUid: null }); await load(); } catch {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted">Manage topic-based delegations (prototype). Clearing: leave delegate blank and Save.</p>
      </div>
      <section className="space-y-2">
        <h2 className="font-semibold text-sm">Current Delegations</h2>
        {loading && <p className="text-xs text-muted">Loading…</p>}
        {!loading && Object.keys(delegations).length===0 && <p className="text-xs text-muted">None set.</p>}
        {Object.entries(delegations).map(([k,v]) => (
          <div key={k} className="flex items-center justify-between text-xs border rounded px-2 py-1 bg-white/40">
            <span className="font-mono">{k}</span>
            <span className="flex items-center gap-2">→ <span className="font-semibold">{v}</span><button className="text-[10px] px-2 py-0.5 border rounded" onClick={()=> clear(k)}>Clear</button></span>
          </div>
        ))}
      </section>
      <section className="space-y-2 max-w-sm">
        <h2 className="font-semibold text-sm">Set / Update Delegation</h2>
  <input value={topic} onChange={e=> setTopic(e.target.value)} placeholder="Topic (e.g. transport)" className="w-full border rounded px-2 py-1 text-xs" />
  <input value={delegateUid} onChange={e=> setDelegateUid(e.target.value)} placeholder="Delegate User UID" className="w-full border rounded px-2 py-1 text-xs" />
        <button onClick={save} className="text-[11px] px-3 py-1 border rounded">Save</button>
        {msg && <p className="text-[11px] text-muted">{msg}</p>}
        <p className="text-[10px] text-muted">Topic slug: 2–32 chars a-z 0-9 _ - . Leave delegate blank to clear.</p>
      </section>
    </div>
  );
}
