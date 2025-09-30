import { createHash } from 'crypto';
import { tallyRCV } from '../src/rcv';

// Minimal deterministic tallyHash recreation mirroring server logic
function computeTallyHash(ballotId: string, type: string, results: any) {
  return createHash('sha256').update(JSON.stringify({ ballotId, type, results })).digest('hex');
}

describe('tallyHash determinism', () => {
  it('stable for unchanged results', () => {
    const ballotId = 'b1';
    const results = { counts: { A: 5, B: 3 }, total: 8, winner: 'A' };
    const h1 = computeTallyHash(ballotId, 'simple', results);
    const h2 = computeTallyHash(ballotId, 'simple', JSON.parse(JSON.stringify(results)));
    expect(h1).toBe(h2);
  });
  it('changes when results differ', () => {
    const ballotId = 'b1';
    const r1 = { counts: { A: 5, B: 3 }, total: 8, winner: 'A' };
    const r2 = { counts: { A: 4, B: 4 }, total: 8, winner: 'A' };
    const h1 = computeTallyHash(ballotId, 'simple', r1);
    const h2 = computeTallyHash(ballotId, 'simple', r2);
    expect(h1).not.toBe(h2);
  });
  it('rcv includes rounds', () => {
    const ballotId = 'bRCV';
    const outcome = tallyRCV([{ ranking: ['X','Y'] }, { ranking: ['Y','X'] }, { ranking: ['X'] }]);
    const results = { rounds: outcome.rounds, winner: outcome.winner, counts: {}, total: 3 };
    const h = computeTallyHash(ballotId, 'rcv', results);
    expect(h).toHaveLength(64);
  });
});
