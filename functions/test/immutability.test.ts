// Pure logic test modeling rules: disallow changes to modelMeta/provenance
function canUpdateDraft(before: any, after: any): boolean {
  return JSON.stringify(before.modelMeta) === JSON.stringify(after.modelMeta)
    && JSON.stringify(before.provenance) === JSON.stringify(after.provenance)
    && before.createdAt === after.createdAt
    && JSON.stringify(before.authors) === JSON.stringify(after.authors);
}

describe('Draft provenance immutability (logical test)', () => {
  const base = {
    draftId: 'd1', modelMeta: { model: 'm', promptHash: 'p', responseHash: 'r' },
    provenance: { promptHash: 'p', responseHash: 'r', modelVersion: 'm', rawResponseSize: 10, createdAt: 1 },
    createdAt: 1, authors: [{ uid: 'u1'}]
  };
  it('rejects promptHash change', () => {
    const updated = { ...base, modelMeta: { ...base.modelMeta, promptHash: 'x' } };
    expect(canUpdateDraft(base, updated)).toBe(false);
  });
  it('allows text-only update (simulated by ignoring text field in predicate)', () => {
    const updated = { ...base, text: 'new text' };
    expect(canUpdateDraft(base, updated)).toBe(true);
  });
});
