import { createHmac } from 'crypto';
import { buildVoteCanonical } from '../src/index';

describe('Vote receipt determinism', () => {
  const secret = 'test_secret';
  it('same canonical input yields identical truncated receipt hash', () => {
    const c1 = buildVoteCanonical('ballotA', 'user1', { choice: 'opt1' }, 1700000000000);
    const c2 = buildVoteCanonical('ballotA', 'user1', { choice: 'opt1' }, 1700000000000);
    const h1 = createHmac('sha256', secret).update(c1).digest('hex').slice(0,32);
    const h2 = createHmac('sha256', secret).update(c2).digest('hex').slice(0,32);
    expect(h1).toBe(h2);
  });
  it('changing timestamp changes receipt hash', () => {
    const c1 = buildVoteCanonical('ballotA', 'user1', { choice: 'opt1' }, 1700000000000);
    const c2 = buildVoteCanonical('ballotA', 'user1', { choice: 'opt1' }, 1700000001000);
    const h1 = createHmac('sha256', secret).update(c1).digest('hex').slice(0,32);
    const h2 = createHmac('sha256', secret).update(c2).digest('hex').slice(0,32);
    expect(h1).not.toBe(h2);
  });
});
