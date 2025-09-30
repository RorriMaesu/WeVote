import { createHash } from 'crypto';

// Re-implement minimal logic from CLI for unit validation
function tallyHash(ballotId: string, type: string, results: any) {
  return createHash('sha256').update(JSON.stringify({ ballotId, type, results })).digest('hex');
}

function verifyLedger(entries: any[]) {
  const issues: string[] = [];
  for (let i=0;i<entries.length;i++) {
    const e = entries[i];
    if (e.canonical) {
      const h = createHash('sha256').update(e.canonical).digest('hex');
      if (h !== e.entryHash) issues.push('hash mismatch '+e.seq);
    }
    if (i>0) {
      if (e.prevHash !== entries[i-1].entryHash) issues.push('link mismatch '+e.seq);
    } else if (e.prevHash !== null) issues.push('first prevHash not null');
  }
  return { ok: issues.length===0, issues };
}

describe('offline verification primitives', () => {
  it('validates tally hash recomputation', () => {
    const results = { counts: { A: 2, B: 1 }, winner: 'A', total: 3 };
    const h = tallyHash('ballot123','simple', results);
    expect(h).toHaveLength(64);
    const changed = tallyHash('ballot123','simple', { ...results, counts: { A:1, B:2 } });
    expect(changed).not.toBe(h);
  });

  it('verifies a good ledger chain', () => {
    const mk = (seq: number, prev: string|null) => {
      const canonical = JSON.stringify({ seq, prevHash: prev, data: { kind: 'tally', ballotId: 'b'+seq, results: { counts: { A: seq }, total: seq }, ts: seq } });
      const entryHash = createHash('sha256').update(canonical).digest('hex');
      return { seq, prevHash: prev, entryHash, canonical };
    };
    const e1 = mk(1,null);
    const e2 = mk(2,e1.entryHash);
    const res = verifyLedger([e1,e2]);
    expect(res.ok).toBe(true);
  });

  it('catches a broken ledger chain', () => {
    const mk = (seq: number, prev: string|null) => {
      const canonical = JSON.stringify({ seq, prevHash: prev, data: { kind: 'tally', ballotId: 'b'+seq, results: { counts: { A: seq }, total: seq }, ts: seq } });
      const entryHash = createHash('sha256').update(canonical).digest('hex');
      return { seq, prevHash: prev, entryHash, canonical };
    };
    const e1 = mk(1,null);
    const e2 = mk(2,'WRONG');
    const res = verifyLedger([e1,e2]);
    expect(res.ok).toBe(false);
    expect(res.issues.some(i=> i.includes('link mismatch')|| i.includes('hash mismatch'))).toBe(true);
  });
});
