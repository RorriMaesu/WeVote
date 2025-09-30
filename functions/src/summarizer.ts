/**
 * Lightweight deterministic summarizer (no external LLM) to compress earlier chat messages.
 * Goal: reduce prompt size & cost. This is heuristic and safe for tests / emulator.
 * Strategy:
 *  - Take an ordered array of messages { role, text } (oldest first).
 *  - Keep only first sentences from early messages until ~800 chars.
 *  - Tag with stable header and counts so canonical hashing (outside) not impacted.
 */
export interface ChatMsg { role: string; text: string }

export interface SummaryResult { summary: string; covered: number; }

const MAX_SUMMARY_CHARS = 800;

export function buildRollingSummary(messages: ChatMsg[]): SummaryResult {
  if (!messages.length) return { summary: '', covered: 0 };
  let buf: string[] = [];
  let total = 0;
  for (const m of messages) {
    const firstSentence = m.text.split(/(?<=[.!?])\s+/)[0].slice(0, 160);
    const fragment = `${m.role === 'user' ? 'U' : 'A'}: ${firstSentence}`;
    if (total + fragment.length + 1 > MAX_SUMMARY_CHARS) break;
    buf.push(fragment);
    total += fragment.length + 1;
  }
  const covered = buf.length;
  const summaryCore = buf.join(' | ');
  const summary = `Condensed summary (v1) covering ${covered} earlier messages: ${summaryCore}`;
  return { summary, covered };
}

/** Decide which portion of history should be summarized.
 * Returns tuple: [messagesToSummarize, recentTail]
 * We keep the last KEEP_TAIL messages verbatim; summarize everything before.
 */
export function partitionForSummary(history: ChatMsg[], keepTail = 12): { toSummarize: ChatMsg[]; tail: ChatMsg[] } {
  if (history.length <= keepTail) return { toSummarize: [], tail: history };
  const split = history.length - keepTail;
  return { toSummarize: history.slice(0, split), tail: history.slice(split) };
}
