import { moderateAssistantReply } from '../src/moderation';

describe('moderateAssistantReply', () => {
  it('flags email and phone', () => {
    const text = 'Contact me at test@example.com or (555) 123-4567.';
    const res = moderateAssistantReply(text);
    expect(res.flags).toContain('pii_email');
    expect(res.flags).toContain('pii_phone');
    expect(res.blocked).toBe(false);
    expect(res.sanitized).toBe(text);
  });

  it('blocks disallowed term', () => {
    const text = 'This contains forbiddenterm inside.';
    const res = moderateAssistantReply(text);
    expect(res.flags).toContain('disallowed_term');
    expect(res.blocked).toBe(true);
    expect(res.sanitized).not.toBe(text);
  });
});
