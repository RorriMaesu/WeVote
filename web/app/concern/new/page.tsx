'use client';
import { FormEvent, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseClient';
import { generateDraftsSafe, chatConcernSafe, summarizeConcernSafe } from '../../../lib/functionsClient';
import { useRouter } from 'next/navigation';

export default function NewConcernPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user'|'assistant'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const ref = await addDoc(collection(db, 'concerns'), {
        title,
        description,
        status: 'idea',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      // If user ran a summary, append it to description for richer prompt (simple heuristic)
      const enrichedId = ref.id;
      if (summary) {
        // Optionally store summary skeleton onto concern doc (non-breaking)
        try { await addDoc(collection(db, 'summaries'), { concernId: enrichedId, summary, createdAt: serverTimestamp() }); } catch {}
      }
      // Trigger LLM draft generation (concern description already stored)
      try { await generateDraftsSafe({ concernId: enrichedId }); } catch(e){ /* ignore */ }
      router.push(`/concern/${ref.id}?gen=1`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
  <h1 className="text-2xl font-semibold mb-4">Create Concern</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} required maxLength={140} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Describe the concern</label>
          <textarea className="input min-h-[160px]" value={description} onChange={e => setDescription(e.target.value)} required />
        </div>
        <div className="border rounded p-3 space-y-3 bg-black/5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Refine with Assistant (optional)</h2>
            {summary && <span className="text-[10px] text-brand-teal">Summary ready</span>}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto text-[11px] bg-white/50 rounded p-2">
            {chatMessages.length === 0 && <p className="text-muted">No conversation yet. Describe specifics or ask for clarification.</p>}
            {chatMessages.map((m,i)=>(<div key={i} className="flex gap-2"><span className="font-semibold capitalize w-14">{m.role}</span><span>{m.text}</span></div>))}
          </div>
          <div className="flex gap-2">
            <input value={chatInput} onChange={e=> setChatInput(e.target.value)} placeholder="Ask a focused question or add detail" className="input text-xs flex-1" />
            <button type="button" disabled={chatBusy || !chatInput || !title} onClick={async ()=> {
              setChatBusy(true);
              const next = [...chatMessages, { role: 'user' as const, text: chatInput }];
              setChatMessages(next); setChatInput('');
              try {
                const resp = await chatConcernSafe({ concernId: 'temp', title: title || '(untitled)', messages: next });
                setChatMessages(msgs=> [...msgs, { role: 'assistant', text: resp.reply }]);
              } catch(e:any) { setChatMessages(msgs=> [...msgs, { role: 'assistant', text: 'Assistant unavailable.' }]); }
              setChatBusy(false);
            }} className="btn-secondary text-[11px] min-w-[80px]">{chatBusy? '…':'Send'}</button>
            <button type="button" disabled={chatBusy || chatMessages.length===0} onClick={async ()=> {
              setChatBusy(true); try {
                const resp = await summarizeConcernSafe({ concernId: 'temp', title: title || '(untitled)', messages: chatMessages });
                setSummary(resp.summary);
              } catch {}
              setChatBusy(false);
            }} className="text-[11px] underline">Summarize</button>
          </div>
          {summary && (
            <div className="text-[10px] bg-white/60 rounded p-2 space-y-1">
              <p><span className="font-semibold">Problem:</span> {summary.problem}</p>
              {summary.objectives && summary.objectives.length>0 && <p><span className="font-semibold">Objectives:</span> {summary.objectives.join(', ')}</p>}
              {summary.constraints && summary.constraints.length>0 && <p><span className="font-semibold">Constraints:</span> {summary.constraints.join(', ')}</p>}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="btn-primary disabled:opacity-50 shadow-md shadow-brand-teal/30">{loading ? 'Submitting...' : 'Generate Drafts'}</button>
      </form>
    </div>
  );
}
