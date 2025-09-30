"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebaseClient';
import { createBallotSafe } from '../../../lib/functionsClient';

interface Draft { draftId: string; text: string; }

export default function NewBallotClient(){
  const sp = useSearchParams();
  const concernId = sp.get('concern') || '';
  const router = useRouter();
  const [drafts,setDrafts] = useState<Draft[]>([]);
  const [selected,setSelected] = useState<Set<string>>(new Set());
  const [type,setType] = useState<'simple'|'approval'|'rcv'>('simple');
  const [duration,setDuration] = useState(60);
  const [minTier, setMinTier] = useState<'basic'|'verified'|'expert'|'admin'>('basic');
  const [loading,setLoading] = useState(true);
  const [message,setMessage] = useState<string|undefined>();
  const [submitting,setSubmitting] = useState(false);

  useEffect(()=>{ if(!concernId) return; (async()=>{
    try {
      const dq = query(collection(db,'drafts'), where('concernId','==', concernId));
      const snaps = await getDocs(dq);
      setDrafts(snaps.docs.map(d=>({ draftId: d.id, ...(d.data() as any)})));
    } catch(e:any){ setMessage(e.message||'Error loading drafts'); }
    setLoading(false);
  })(); },[concernId]);

  function toggle(id:string){ const ns = new Set(selected); ns.has(id)?ns.delete(id):ns.add(id); setSelected(ns); }
  function draftOrder(){ return Array.from(selected); }

  async function submit(){
    if(selected.size < 2){ setMessage('Select at least two draft options'); return; }
    setSubmitting(true); setMessage(undefined);
    try {
    const options = draftOrder().map((id,i)=> ({ id, label: `Option ${String.fromCharCode(65+i)}` }));
  const res:any = await createBallotSafe({ concernId, type, options, durationMinutes: duration, minTier });
      const ballotId = res?.data?.ballotId || res?.ballotId;
      if(!ballotId) throw new Error('Missing ballotId in response');
      router.push(`/ballot/${ballotId}`);
    } catch(e:any){ setMessage(e.message||'Error creating ballot'); }
    setSubmitting(false);
  }

  if(!concernId) return <p className='text-sm text-red-600'>Missing concern id.</p>;
  if(loading) return <p className='text-sm text-muted'>Loading drafts…</p>;

  return (
    <div className='space-y-6 pb-20'>
      <div>
        <h1 className='text-2xl font-semibold'>Open Ballot</h1>
  <p className='text-xs text-muted'>Select 2+ drafts for this ballot. Each selected draft must have at least one expert/legal/fact review before a ballot can open.</p>
      </div>
      <section className='space-y-3'>
        <h2 className='font-medium text-sm'>Drafts</h2>
        <div className='space-y-3'>
          {drafts.map(d=> {
            const active = selected.has(d.draftId);
            return (
              <article key={d.draftId} className={`card cursor-pointer border ${active?'border-brand-teal':'border-transparent'}`} onClick={()=>toggle(d.draftId)}>
                <pre className='whitespace-pre-wrap text-[11px] leading-snug max-h-40 overflow-y-auto'>{d.text}</pre>
              </article>
            );
          })}
        </div>
      </section>
      <section className='flex flex-wrap gap-4 items-end'>
        <div>
          <label className='block text-xs font-medium mb-1'>Ballot Type</label>
          <select value={type} onChange={e=> setType(e.target.value as any)} className='input text-xs'>
            <option value='simple'>Simple (choose 1)</option>
            <option value='approval'>Approval (multi-select)</option>
            <option value='rcv'>Ranked Choice</option>
          </select>
        </div>
        <div>
          <label className='block text-xs font-medium mb-1'>Duration (minutes)</label>
          <input type='number' min={5} max={24*60} value={duration} onChange={e=> setDuration(Number(e.target.value))} className='input text-xs w-32'/>
        </div>
        <div>
          <label className='block text-xs font-medium mb-1'>Minimum Voter Tier</label>
          <select value={minTier} onChange={e=> setMinTier(e.target.value as any)} className='input text-xs'>
            <option value='basic'>Basic</option>
            <option value='verified'>Verified</option>
            <option value='expert'>Expert</option>
            <option value='admin'>Admin</option>
          </select>
        </div>
        <div className='hidden sm:flex-1 sm:block'>
          <button disabled={submitting} onClick={submit} className='btn-primary text-sm'>{submitting? 'Creating…':'Create Ballot'}</button>
        </div>
      </section>
      {message && <p className='text-xs text-red-600'>{message}</p>}
      <div className='sm:hidden fixed left-0 right-0 bottom-0 px-4 py-3 mobile-sticky-bar border-t flex justify-end'>
        <button disabled={submitting} onClick={submit} className='btn-primary w-full text-sm'>{submitting? 'Creating…':'Create Ballot'}</button>
      </div>
    </div>
  );
}
