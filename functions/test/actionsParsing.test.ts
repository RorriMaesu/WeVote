import { parseActionSuggestions, estimateTokens } from '../src/actions';

describe('parseActionSuggestions', () => {
  const allowed = new Set(['generate_drafts']);
  it('extracts valid actions', () => {
    const txt = 'Answer body.\nACTION_JSON: {"actions":[{"type":"generate_drafts","label":"Generate Draft Options"}]}'
    const res = parseActionSuggestions(txt, allowed);
    expect(res.actions.length).toBe(1);
    expect(res.actions[0].type).toBe('generate_drafts');
    expect(res.reply).toContain('Answer body');
  });
  it('filters unknown actions', () => {
    const txt = 'Hi\nACTION_JSON: {"actions":[{"type":"hack"}]}'
    const res = parseActionSuggestions(txt, allowed);
    expect(res.actions.length).toBe(0);
  });
  it('handles malformed JSON gracefully', () => {
    const txt = 'Hi\nACTION_JSON: {"actions": [oops}'
    const res = parseActionSuggestions(txt, allowed);
    expect(res.actions.length).toBe(0);
    expect(res.rawMatched).toBe(true);
  });
});

describe('estimateTokens', () => {
  it('roughly counts words for small strings', () => {
    expect(estimateTokens('one two three four')).toBe(4);
  });
  it('falls back to length heuristic for large input', () => {
    const big = 'a'.repeat(20000);
    expect(estimateTokens(big)).toBe(Math.ceil(20000/4));
  });
});
