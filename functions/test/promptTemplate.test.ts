import { buildDraftOptionsPrompt } from '../src/prompts';
import { createHash } from 'crypto';

describe('prompt template', () => {
  it('produces deterministic templateHash independent of user content', () => {
    const a = buildDraftOptionsPrompt('Title A','Description A');
    const b = buildDraftOptionsPrompt('Different Title','Another Description');
    expect(a.templateHash).toBe(b.templateHash);
  });
  it('changes promptHash when user content changes', () => {
    const a = buildDraftOptionsPrompt('Title A','Description A');
    const b = buildDraftOptionsPrompt('Title B','Description B');
    // Recompute user-level promptHash analog (mirrors generate function hashing approach)
    const hashA = createHash('sha256').update(a.prompt).digest('hex');
    const hashB = createHash('sha256').update(b.prompt).digest('hex');
    expect(hashA).not.toBe(hashB);
  });
});
