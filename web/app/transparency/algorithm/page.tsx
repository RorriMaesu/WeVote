"use client";
import { useMemo } from 'react';
import { tallyRCV } from '../../../../packages/shared/tally/rcv';

export default function AlgorithmExplain() {
  // Sample deterministic RCV demo data
  const sample = useMemo(()=> {
    const ballots = [
      { ranking: ['A','B','C'] },
      { ranking: ['B','A','C'] },
      { ranking: ['B','C','A'] },
      { ranking: ['C','B','A'] },
      { ranking: ['A','C','B'] }
    ];
    return tallyRCV(ballots as any);
  },[]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ballot Tally Algorithms</h1>
        <p className="text-sm text-muted max-w-prose mt-1">We publish our counting logic so anyone can reproduce tallies offline. For Ranked Choice Voting (Instant Runoff), each round counts current first preferences; the lowest candidate is eliminated and their ballots transfer to the next ranked continuing candidate until a winner emerges or a tie persists.</p>
      </div>
      <section className="space-y-2 text-xs">
        <h2 className="font-semibold text-sm">Ranked Choice (IRV) Example</h2>
        <pre className="p-2 bg-black/5 rounded overflow-auto text-[11px]">{JSON.stringify(sample.rounds, null, 2)}</pre>
        <p>Winner: <span className="font-semibold">{sample.winner}</span></p>
        <p className="text-[11px] text-muted">Tie-break strategy (if needed): lexicographically compare candidate IDs among lowest group; eliminate last.</p>
      </section>
      <section className="space-y-2 text-xs">
        <h2 className="font-semibold text-sm">Simple & Approval</h2>
        <p>Simple: highest vote count wins. Approval: each option accrues one count per approving voter; highest total wins. Hash of tally uses canonical JSON: <code className="font-mono">sha256(JSON.stringify(&#123; ballotId, type, results &#125;))</code>.</p>
      </section>
      <section className="space-y-2 text-xs">
        <h2 className="font-semibold text-sm">Verification Tools</h2>
        <p>Use the offline CLI (<code>packages/shared/dist/verify/cli.js</code>) to recompute tally hashes and verify the ledger chain. Download a ballot export bundle and run:</p>
        <pre className="p-2 bg-black/5 rounded text-[11px] whitespace-pre">node packages/shared/dist/verify/cli.js --ballot export.json --ledger ledger.json</pre>
      </section>
    </div>
  );
}
