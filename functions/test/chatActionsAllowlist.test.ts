// Simple allowlist post-processing test replicating filtering logic
function filterActions(actions:any[]){
  const ALLOWED_ACTIONS = new Set(['generate_drafts']);
  return actions.filter(a => a && ALLOWED_ACTIONS.has(a.type));
}

describe('Chat action allowlist', () => {
  it('keeps only allowed action types', () => {
    const input = [ { type:'generate_drafts' }, { type:'unknown' }, null, { type:'GENERATE_DRAFTS' } ];
    const out = filterActions(input);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('generate_drafts');
  });
});
