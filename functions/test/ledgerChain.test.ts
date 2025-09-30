import { buildCanonical } from '../src/ledger';

describe('Ledger canonical builder', () => {
  it('produces stable entryHash for same input', () => {
    const a1 = buildCanonical(1, null, { kind: 'tally', ballotId: 'b1', results: { a:1 }, ts: 1000 });
    const a2 = buildCanonical(1, null, { kind: 'tally', ballotId: 'b1', results: { a:1 }, ts: 1000 });
    expect(a1.entryHash).toBe(a2.entryHash);
  });
  it('chains hashes correctly', () => {
    const first = buildCanonical(1, null, { kind: 'tally', ballotId: 'b1', results: { a:1 }, ts: 1000 });
    const second = buildCanonical(2, first.entryHash, { kind: 'tally', ballotId: 'b2', results: { b:2 }, ts: 2000 });
    expect(second.canonical).toContain(first.entryHash);
  });
});
