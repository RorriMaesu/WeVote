import { testApplyDraftRateLimit, resetDb } from './helpers';

describe('Draft rate limit helper', () => {
  beforeAll(async ()=> { await resetDb(); });
  it('allows first 10 and rejects the 11th within window', async () => {
    for (let i=0;i<10;i++) {
      await testApplyDraftRateLimit('u1');
    }
    await expect(testApplyDraftRateLimit('u1')).rejects.toThrow('resource-exhausted');
  });
});
