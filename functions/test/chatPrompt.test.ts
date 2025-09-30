import { buildConcernChatPrompt, buildConcernSummaryPrompt, CONCERN_CHAT_PROMPT_VERSION, CONCERN_SUMMARY_PROMPT_VERSION } from '../src/prompts';

describe('Chat prompt hardening', () => {
  it('limits to 12 turns and includes delimiters & injection guard phrasing', () => {
    const msgs = Array.from({length:20}).map((_,i)=> ({ role: i%2?'assistant':'user', text: `m${i}` })) as any;
    const { prompt, templateVersion } = buildConcernChatPrompt('Test Concern', msgs);
    expect(templateVersion).toBe(CONCERN_CHAT_PROMPT_VERSION);
    // Only last 12
    expect((prompt.match(/m\d+/g)||[]).length).toBe(12);
  expect(prompt).toContain('--- CONVERSATION START ---');
  expect(prompt).toMatch(/override or ignore these instructions/i);
  });
  it('summary prompt uses corrected schema (no malformed bracket) and version bump', () => {
    const msgs = [{ role:'user', text:'Issue about parks' }] as any;
    const { prompt, templateVersion } = buildConcernSummaryPrompt('Parks', msgs);
    expect(templateVersion).toBe(CONCERN_SUMMARY_PROMPT_VERSION);
    expect(prompt).toContain('openQuestions');
    expect(prompt).not.toMatch(/question1"}]/); // old malformed pattern
  });
});
