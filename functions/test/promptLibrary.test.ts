import { listPromptLibrary, CONCERN_CHAT_PROMPT_VERSION, CONCERN_SUMMARY_PROMPT_VERSION, DRAFT_OPTIONS_PROMPT_VERSION } from '../src/prompts';

describe('prompt library listing', () => {
  it('includes updated versions & hashes', () => {
    const lib = listPromptLibrary();
    const ids = lib.map(l=>l.id);
    expect(ids).toEqual(expect.arrayContaining(['draft_options','concern_chat','concern_summary']));
    const chat = lib.find(l=> l.id==='concern_chat')!;
    const summary = lib.find(l=> l.id==='concern_summary')!;
    expect(chat.version).toBe(CONCERN_CHAT_PROMPT_VERSION);
    expect(summary.version).toBe(CONCERN_SUMMARY_PROMPT_VERSION);
    const draft = lib.find(l=> l.id==='draft_options')!;
    expect(draft.version).toBe(DRAFT_OPTIONS_PROMPT_VERSION);
    // Basic hash format check
    [chat, summary, draft].forEach(e => expect(e.templateHash).toMatch(/^[a-f0-9]{64}$/));
  });
});
