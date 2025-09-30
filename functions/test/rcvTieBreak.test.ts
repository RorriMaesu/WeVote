import { tallyRCV } from '../src/rcv';

// Helper to build ballots quickly
function ballots(list: string[][]) { return list.map(r => ({ ranking: r })); }

describe('RCV tie-break logic', () => {
  it('eliminates lexicographically last among lowest tied', () => {
    // Round 1: A:1, B:1, C:1 (all tied lowest). Expect elimination of C (lexicographically last)
    const outcome = tallyRCV(ballots([
      ['A','B','C'],
      ['B','A','C'],
      ['C','A','B']
    ]));
    expect(outcome.rounds[0].eliminated).toBe('C');
  });
  it('transfers after elimination and finds winner', () => {
    const outcome = tallyRCV(ballots([
      ['A','B','C'], // A
      ['B','A','C'], // B
      ['C','B','A'], // C
      ['C','A','B']  // C
    ]));
    // Counts Round1: A:1,B:1,C:2 -> no majority (4/2=2) winner none, eliminate lowest among A,B (both 1) => B (lexicographically later) eliminated
    expect(outcome.rounds[0].eliminated).toBe('B');
    // After elimination ballots transferring should give A vs C
    expect(outcome.winner === 'A' || outcome.winner === 'C').toBe(true);
  });
  it('declares immediate majority winner', () => {
    const outcome = tallyRCV(ballots([
      ['A','B','C'],
      ['A','C','B'],
      ['A','B'],
      ['B','A'],
      ['C','A']
    ]));
    // A has 3/5 > 2.5 majority
    expect(outcome.winner).toBe('A');
    expect(outcome.rounds.length).toBe(1);
  });
});
