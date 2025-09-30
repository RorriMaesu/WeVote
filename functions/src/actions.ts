/** Action suggestion parsing & validation helper.
 * Extracts an ACTION_JSON block of the form:
 *   ACTION_JSON: {"actions":[{"type":"generate_drafts","label":"Generate Draft Options"}]}
 * Validation rules:
 *  - JSON must parse to object with array field `actions`.
 *  - Each action object must have string `type` and optional `label`.
 *  - Only allowed action types are retained.
 *  - Hard size limits: raw JSON segment <= 2000 chars, actions array <= 5.
 *  - Silently ignore malformed JSON.
 */
export interface ParsedActionsResult { reply: string; actions: { type: string; label?: string }[]; rawMatched: boolean; }

export function parseActionSuggestions(text: string, allowed: Set<string>): ParsedActionsResult {
  const match = text.match(/ACTION_JSON:\s*(\{[\s\S]*$)/m);
  if (!match) return { reply: text.trim(), actions: [], rawMatched: false };
  let reply = text.replace(/ACTION_JSON:[\s\S]*/,'').trim();
  const jsonPart = match[1].trim();
  if (jsonPart.length > 2000) return { reply, actions: [], rawMatched: true };
  try {
    const parsed = JSON.parse(jsonPart);
    if (parsed && Array.isArray(parsed.actions)) {
      const cleaned = parsed.actions
        .filter((a: any) => a && typeof a.type === 'string' && allowed.has(a.type))
        .slice(0,5)
        .map((a: any) => ({ type: a.type, ...(typeof a.label === 'string' ? { label: a.label.slice(0,80) } : {}) }));
      return { reply, actions: cleaned, rawMatched: true };
    }
  } catch { /* swallow */ }
  return { reply, actions: [], rawMatched: true };
}

// Very rough token estimate: split on whitespace, fallback length/4 heuristic for long continuous strings
export function estimateTokens(str: string): number {
  if (!str) return 0;
  if (str.length < 12000) return str.split(/\s+/).filter(Boolean).length;
  return Math.ceil(str.length / 4);
}
