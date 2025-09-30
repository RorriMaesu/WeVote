"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { generateDraftsSafe, reportContentSafe, chatSendSafe } from '../../../lib/functionsClient';
import { appendCitationsSafe, submitDraftReviewSafe } from '../../../lib/functionsClient';
import Link from 'next/link';

interface Draft { draftId: string; text: string; status: string; }

export default function ConcernDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [concern, setConcern] = useState<any>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string|undefined>();
  const [reporting, setReporting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportNote, setReportNote] = useState('');
  const [userTier, setUserTier] = useState<string>('basic');
  const [chatMessages, setChatMessages] = useState<{ role: 'user'|'assistant'; text: string; id?: string; actions?: any[] }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false); // mobile fullscreen toggle
  const [showActionModal, setShowActionModal] = useState<{ actions: any[] }|null>(null);
  const chatExpandedInputRef = useRef<HTMLInputElement|null>(null);
  const expandBtnRef = useRef<HTMLButtonElement|null>(null);
  const chatScrollRef = useRef<HTMLDivElement|null>(null);
  const chatScrollFullRef = useRef<HTMLDivElement|null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(()=> {
    const el = chatExpanded ? chatScrollFullRef.current : chatScrollRef.current;
    if (!el) return;
    // slight delay to allow DOM paint
    requestAnimationFrame(()=> { el.scrollTop = el.scrollHeight; });
  }, [chatMessages, chatExpanded]);

  // Focus management when expanding / collapsing chat
  useEffect(()=> {
    if (chatExpanded) {
      // focus input after open
      setTimeout(()=> chatExpandedInputRef.current?.focus(), 40);
    } else {
      // restore focus to expand trigger if it exists
      setTimeout(()=> expandBtnRef.current?.focus(), 40);
    }
  }, [chatExpanded]);

  // Auth listener
  useEffect(()=> {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return ()=>unsub();
  },[]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const snap = await getDoc(doc(db, 'concerns', id));
      if (snap.exists()) setConcern({ id: snap.id, ...snap.data() });
      const dq = query(collection(db, 'drafts'), where('concernId','==', id), orderBy('createdAt','asc'));
  const draftsSnap = await getDocs(dq);
  setDrafts(draftsSnap.docs.map(d => d.data() as any));
      setLoading(false);
    })();
  }, [id]);

  // Fetch user tier
  useEffect(()=> { (async () => { if (!user) return; try { const us = await getDoc(doc(db,'users', user.uid)); if (us.exists()) setUserTier((us.data() as any).tier || 'basic'); } catch {} })(); }, [user]);

  async function regenerate() {
    if (!id) return;
    setGenerating(true); setMessage(undefined);
    try {
  await generateDraftsSafe({ concernId: id });
      setMessage('Drafts generation requested. Refreshing…');
      // simple refetch
      const dq = query(collection(db, 'drafts'), where('concernId','==', id), orderBy('createdAt','asc'));
      const draftsSnap = await getDocs(dq);
      setDrafts(draftsSnap.docs.map(d => d.data() as Draft));
    } catch(e:any) { setMessage(e.message || 'Error'); }
    setGenerating(false);
  }

  async function sendChat() {
    if (!id || !chatInput || chatBusy) return;
    const userText = chatInput;
    setChatInput('');
    setChatMessages(msgs => [...msgs, { role: 'user', text: userText }]);
    setChatBusy(true);
    try {
      const resp = await chatSendSafe({ concernId: id, message: userText });
      setChatMessages(msgs => [...msgs, { role: 'assistant', text: resp.reply, actions: resp.actions }]);
      // Auto-suggest scroll to bottom
      setTimeout(()=> {
        const el = document.getElementById('chatScroll'); if (el) el.scrollTop = el.scrollHeight;
      }, 30);
    } catch (e:any) {
      setChatMessages(msgs => [...msgs, { role: 'assistant', text: 'Assistant unavailable. Try again soon.' }]);
    }
    setChatBusy(false);
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;
  if (!concern) return <p className="text-sm text-red-600">Concern not found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">{concern.title}</h1>
  <p className="text-muted whitespace-pre-wrap text-sm">{concern.description}</p>
        {user && <div className="mt-2 flex gap-3 items-center">
          <button onClick={()=> setShowReport(s=>!s)} className="text-[11px] underline text-red-600">{showReport? 'Cancel Report':'Report Concern'}</button>
        </div>}
        {showReport && (
          <div className="mt-3 border rounded p-3 bg-black/5 space-y-2 max-w-md">
            <div className="flex gap-2 items-center">
              <select value={reportReason} onChange={e=> setReportReason(e.target.value)} className="input text-xs">
                <option value='hate'>Hate</option>
                <option value='harassment'>Harassment</option>
                <option value='spam'>Spam</option>
                <option value='illicit'>Illicit</option>
                <option value='self-harm'>Self-harm</option>
                <option value='other'>Other</option>
              </select>
              <input value={reportNote} onChange={e=> setReportNote(e.target.value)} placeholder="Optional note" className="input text-xs flex-1" />
              <button disabled={reporting} onClick={async ()=> {
                setReporting(true); setMessage(undefined);
                try { await reportContentSafe({ targetRef: `concerns/${id}`, reason: reportReason as any, note: reportNote }); setShowReport(false); setReportNote(''); setMessage('Report submitted'); }
                catch(e:any){ setMessage(e.message||'Error reporting'); }
                setReporting(false);
              }} className="btn-secondary text-[11px]">{reporting? '…':'Submit'}</button>
            </div>
            <p className="text-[10px] text-muted">Abuse reports are confidential; moderators review patterns before taking action.</p>
          </div>
        )}
      </div>
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium">Draft Options</h2>
          {user && <button disabled={generating} onClick={regenerate} className="btn-secondary text-xs disabled:opacity-50 min-h-[30px]">{generating? 'Generating…' : (drafts.length? 'Regenerate' : 'Generate')}</button>}
          {user && drafts.length >= 2 && <Link href={`/ballots/new?concern=${id}`} className="text-xs underline text-brand-teal">Open Ballot</Link>}
        </div>
  {drafts.length === 0 && <p className="text-xs text-muted">No drafts yet. {user? 'Click Generate to create initial options.' : 'Sign in to generate drafts.'}</p>}
        <div className="space-y-3">
          {drafts.map(d => (
            <DraftCard key={d.draftId} draft={d} user={user} userTier={userTier} refresh={async ()=> {
              const dq = query(collection(db, 'drafts'), where('concernId','==', id), orderBy('createdAt','asc'));
              const draftsSnap = await getDocs(dq);
              setDrafts(draftsSnap.docs.map(x => x.data() as any));
            }} />
          ))}
        </div>
  {message && <p className="text-[11px] text-muted">{message}</p>}
      </section>
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium">Assistant Chat</h2>
          <span className="text-[10px] text-muted hidden sm:inline">Refine this concern before opening a ballot</span>
          <button ref={expandBtnRef} onClick={()=> setChatExpanded(true)} className="sm:hidden ml-auto text-[10px] underline" aria-expanded={chatExpanded} aria-controls="chatScroll-full">Expand</button>
        </div>
        <div className="relative border rounded-lg overflow-hidden bg-gradient-to-br from-white to-white/60 shadow-sm">
          <div className="absolute inset-0 pointer-events-none animate-pulse bg-[radial-gradient(circle_at_20%_20%,rgba(0,194,168,0.08),transparent_60%)]" />
          <div ref={chatScrollRef} className="relative max-h-72 overflow-y-auto p-3 space-y-3 text-[11px]" id="chatScroll" role="log" aria-live="polite" aria-relevant="additions text">
            {chatMessages.length === 0 && <p className="text-muted text-xs">Ask a question like “Which stakeholders are impacted?”</p>}
            {chatMessages.map((m,i)=> (
              <div key={i} className={`group flex ${m.role==='user'?'justify-end':''}`}>
                <div className={`max-w-[70%] rounded-md px-3 py-2 backdrop-blur border transition-all duration-300 ${m.role==='user' ? 'bg-brand-teal text-white border-brand-teal/40 shadow-lg shadow-brand-teal/30 translate-y-0 hover:-translate-y-0.5' : 'bg-white/70 border-black/10 shadow-sm'} animate-fadeIn`}> 
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  {m.actions && m.actions.length>0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.actions.map((a: any,idx:number)=> (
                        <button key={idx} onClick={()=> setShowActionModal({ actions: [a] })} className="text-[10px] px-2 py-1 rounded bg-black/10 hover:bg-black/20 transition-colors">
                          {a.label || a.type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatBusy && <div className="text-[10px] text-muted animate-pulse">Assistant thinking…</div>}
          </div>
          {user && (
            <div className="relative border-t bg-white/80 backdrop-blur p-2 flex gap-2 items-center">
              <input value={chatInput} onChange={e=> setChatInput(e.target.value)} onKeyDown={e=> { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }} placeholder="Ask or refine… (Enter to send)" className="flex-1 text-xs rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/40" />
              <button onClick={sendChat} disabled={chatBusy || !chatInput} className="text-[11px] px-3 py-2 rounded-md bg-brand-teal text-white disabled:opacity-40 hover:shadow-md transition-all">Send</button>
            </div>
          )}
          {!user && <div className="p-2 text-[10px] text-center text-muted">Sign in to chat with the assistant.</div>}
        </div>
        <style jsx>{`
          .animate-fadeIn { animation: fadeIn .4s ease; }
          @keyframes fadeIn { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: translateY(0); } }
        `}</style>
      </section>
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold">Assistant Action</h3>
            {showActionModal.actions.map((a,i)=>(<div key={i} className="text-xs border rounded p-2 bg-black/5">{a.type === 'generate_drafts' ? 'Generate initial draft options for this concern.' : a.label || a.type}</div>))}
            <div className="flex justify-end gap-2 text-[11px]">
              <button onClick={()=> setShowActionModal(null)} className="px-3 py-1 rounded border">Cancel</button>
              <button onClick={async ()=> {
                const action = showActionModal.actions[0];
                setShowActionModal(null);
                if (action?.type === 'generate_drafts' && id) {
                  setGenerating(true); try { await generateDraftsSafe({ concernId: id }); } catch {} setGenerating(false);
                }
              }} className="px-3 py-1 rounded bg-brand-teal text-white shadow hover:shadow-md transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}
      {chatExpanded && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)] animate-fadeIn">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-[var(--bg)]/90 backdrop-blur">
            <h2 className="text-sm font-semibold">Assistant Chat</h2>
            <button onClick={()=> setChatExpanded(false)} className="btn-ghost text-xs">Close</button>
          </div>
          <div ref={chatScrollFullRef} className="flex-1 overflow-y-auto p-3 space-y-3 text-[11px]" id="chatScroll-full" role="log" aria-live="polite" aria-relevant="additions text">
            {chatMessages.length === 0 && <p className="text-muted text-xs">Ask a question like “Which stakeholders are impacted?”</p>}
            {chatMessages.map((m,i)=> (
              <div key={i} className={`group flex ${m.role==='user'?'justify-end':''}`}>
                <div className={`max-w-[80%] rounded-md px-3 py-2 backdrop-blur border transition-all duration-300 ${m.role==='user' ? 'bg-brand-teal text-white border-brand-teal/40 shadow-lg shadow-brand-teal/30' : 'bg-white/70 border-black/10 shadow-sm'} animate-fadeIn`}> 
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  {m.actions && m.actions.length>0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.actions.map((a: any,idx:number)=> (
                        <button key={idx} onClick={()=> setShowActionModal({ actions: [a] })} className="text-[10px] px-2 py-1 rounded bg-black/10 hover:bg-black/20 transition-colors">
                          {a.label || a.type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatBusy && <div className="text-[10px] text-muted animate-pulse">Assistant thinking…</div>}
          </div>
          {user && (
            <div className="border-t p-2 flex gap-2 items-center bg-[var(--bg)]/95">
              <input ref={chatExpandedInputRef} value={chatInput} onChange={e=> setChatInput(e.target.value)} onKeyDown={e=> { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }} placeholder="Ask or refine… (Enter to send)" className="flex-1 text-xs rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/40" />
              <button onClick={sendChat} disabled={chatBusy || !chatInput} className="text-[11px] px-3 py-2 rounded-md bg-brand-teal text-white disabled:opacity-40 hover:shadow-md transition-all">Send</button>
            </div>
          )}
          {!user && <div className="p-2 text-[10px] text-center text-muted">Sign in to chat with the assistant.</div>}
        </div>
      )}
    </div>
  );
}

function DraftCard({ draft, user, userTier, refresh }: { draft: any; user: any; userTier: string; refresh: () => Promise<void> }) {
  const [showCite, setShowCite] = useState(false);
  const [citeUrl, setCiteUrl] = useState('');
  const [citeExcerpt, setCiteExcerpt] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [reviewKind, setReviewKind] = useState<'legal'|'fact'|'expert'>('expert');
  const [reviewNote, setReviewNote] = useState('');
  const [busy, setBusy] = useState(false);
  async function addCitation() {
    setBusy(true);
    try {
      await appendCitationsSafe({ draftId: draft.draftId, citations: [{ url: citeUrl, excerpt: citeExcerpt }] });
      setCiteUrl(''); setCiteExcerpt(''); setShowCite(false); await refresh();
    } catch (e:any) {/* optionally show message */}
    setBusy(false);
  }
  async function addReview() {
    setBusy(true);
    try {
      await submitDraftReviewSafe({ draftId: draft.draftId, kind: reviewKind, note: reviewNote });
      setShowReview(false); setReviewNote(''); await refresh();
    } catch (e:any) { /* ignore */ }
    setBusy(false);
  }
  const citations = draft.citations || [];
  const reviews = draft.reviews || [];
  return (
    <article className="card space-y-3">
      <div className="prose prose-sm max-w-none">
        <pre className="whitespace-pre-wrap text-xs">{draft.text}</pre>
      </div>
      <div className="flex flex-wrap gap-3 items-center text-[10px]">
        <span className="px-2 py-1 bg-black/10 rounded">Citations: {citations.length}</span>
        <span className="px-2 py-1 bg-black/10 rounded">Reviews: {reviews.length}</span>
        {user && <>
          <button onClick={()=> setShowCite(s=>!s)} className="underline">{showCite?'Cancel':'Add Citation'}</button>
          {(['expert','admin'].includes(userTier)) && <button onClick={()=> setShowReview(s=>!s)} className="underline">{showReview?'Cancel':'Add Review'}</button>}
        </>}
      </div>
      {showCite && (
        <div className="space-y-2 border rounded p-2 bg-black/5">
          <input value={citeUrl} onChange={e=> setCiteUrl(e.target.value)} placeholder="Source URL" className="input text-[11px] w-full" />
          <textarea value={citeExcerpt} onChange={e=> setCiteExcerpt(e.target.value)} placeholder="Excerpt / context" className="input text-[11px] w-full h-16" />
          <button disabled={busy || !citeUrl} onClick={addCitation} className="btn-secondary text-[11px]">{busy? '…':'Save Citation'}</button>
        </div>
      )}
      {citations.length>0 && (
        <ul className="text-[10px] list-disc ml-4 max-h-32 overflow-y-auto">
          {citations.map((c:any,i:number)=>(<li key={i}><a href={c.url} target="_blank" className="underline break-all">{c.url?.slice(0,80)}</a>{c.excerpt && <span className="opacity-70"> — {c.excerpt.slice(0,60)}</span>}</li>))}
        </ul>
      )}
      {showReview && (
        <div className="space-y-2 border rounded p-2 bg-black/5">
          <select value={reviewKind} onChange={e=> setReviewKind(e.target.value as any)} className="input text-[11px]">
            <option value='expert'>Expert</option>
            <option value='legal'>Legal</option>
            <option value='fact'>Fact</option>
          </select>
          <textarea value={reviewNote} onChange={e=> setReviewNote(e.target.value)} placeholder="Optional note" className="input text-[11px] w-full h-16" />
          <button disabled={busy} onClick={addReview} className="btn-secondary text-[11px]">{busy? '…':'Submit Review'}</button>
        </div>
      )}
      {reviews.length>0 && (
        <div className="text-[10px] space-y-1 max-h-32 overflow-y-auto">
          {reviews.map((r:any,i:number)=>(<div key={i} className="border rounded px-2 py-1 flex justify-between">
            <span>{r.kind} · {r.role}</span>
            <span className="opacity-60">{new Date(r.signedAt).toLocaleDateString()}</span>
          </div>))}
        </div>
      )}
    </article>
  );
}

// removed standalone placeholders (integrated into component)
