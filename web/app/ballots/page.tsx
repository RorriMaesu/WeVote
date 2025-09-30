"use client";
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebaseClient';
import Link from 'next/link';

interface Ballot { ballotId: string; type: string; startAt?: any; endAt?: any; concernId: string; status: string; }

export default function BallotsPage() {
  const [ballots, setBallots] = useState<Ballot[]>([]);
  useEffect(() => { (async () => {
    const snap = await getDocs(query(collection(db,'ballots'), orderBy('startAt','desc'), limit(50)));
    setBallots(snap.docs.map(d=>d.data() as Ballot));
  })(); }, []);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-semibold tracking-tight">Ballots</h1>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {ballots.map(b => (
          <Link key={b.ballotId} href={`/ballot/${b.ballotId}`} className="card block hover:shadow-md hover:translate-y-[-2px] transition">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="font-medium text-sm">{b.ballotId}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.status==='open'?'bg-green-500/15 text-green-600 dark:text-green-400':'bg-black/10 dark:bg-white/10 text-muted'}`}>{b.status}</span>
            </div>
            <p className="text-[11px] text-muted">{b.type.toUpperCase()}</p>
          </Link>
        ))}
        {ballots.length === 0 && <p className="text-sm text-muted col-span-full">No ballots yet.</p>}
      </div>
    </div>
  );
}
