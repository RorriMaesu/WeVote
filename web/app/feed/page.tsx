"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebaseClient';
import Link from 'next/link';

interface Concern { id: string; title: string; description: string; createdAt?: any; }

export default function FeedPage() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const q = query(collection(db, 'concerns'), orderBy('createdAt','desc'), limit(25));
      const snap = await getDocs(q);
      setConcerns(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    })();
  }, []);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-semibold tracking-tight">Recent Concerns</h1>
        <Link href="/concern/new" className="btn-secondary text-xs">Create</Link>
      </div>
      {loading && (
        <div className="grid sm:grid-cols-2 gap-4" aria-live="polite">
          {Array.from({length:4}).map((_,i)=>(
            <div key={i} className="rounded-card h-24 bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 animate-pulse" />
          ))}
        </div>
      )}
      {!loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {concerns.map(c => (
            <Link key={c.id} href={`/concern/${c.id}`} className="card hover:shadow-md hover:translate-y-[-2px] transition block">
              <h3 className="font-medium mb-1 line-clamp-1 text-sm">{c.title}</h3>
              <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">{c.description}</p>
            </Link>
          ))}
          {concerns.length === 0 && <p className="text-sm text-muted col-span-full">No concerns yet.</p>}
        </div>
      )}
    </div>
  );
}
