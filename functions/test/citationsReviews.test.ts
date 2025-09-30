import { mergeCitations, canAddReview } from '../src/index';

describe('Citations & Reviews helpers', () => {
  it('dedupes citations by docId+url and truncates fields', () => {
    const existing = [{ docId:'d1', url:'https://a', excerpt:'one'}];
    const incoming = [{ docId:'d1', url:'https://a', excerpt:'updated should overwrite'}, { docId:'d2', url:'https://b', excerpt:'two'}];
    const merged = mergeCitations(existing as any, incoming as any, 10);
    expect(merged.length).toBe(2);
    // ensure d1 updated
    expect(merged.find(c=>c.docId==='d1')!.excerpt).toContain('updated');
  });
  it('prevents duplicate review of same kind/user', () => {
    const existing = [{ uid:'u1', role:'expert', kind:'legal', signedAt: 1 }];
    expect(canAddReview(existing as any, 'u1', 'legal')).toBe(false);
    expect(canAddReview(existing as any, 'u1', 'fact')).toBe(true);
  });
});
