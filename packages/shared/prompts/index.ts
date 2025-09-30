import { createHash } from 'crypto';
export const DRAFT_OPTIONS_PROMPT_VERSION = 'v1';
export function draftOptionsPromptTemplatePreview() { return 'You are generating neutral, concise policy draft option summaries.\nConcern Title: <title>\nConcern Description: <description>\nProduce EXACT JSON with schema: {"options":[{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."}]}\nConstraints: 1-3 sentences per option; neutral tone; no leading commentary; no markdown; no extra keys.'; }
export function draftOptionsTemplateHash() { return createHash('sha256').update('TEMPLATE|draft_options|v1|FIELDS:Title,Description|FORMAT:options[A,B,C]').digest('hex'); }
export interface PromptLibEntry { id: string; purpose: string; version: string; templateHash: string; preview: string; };
export function getPromptLibrary(): PromptLibEntry[] {
  return [ { id: 'draft_options', purpose: 'Generate up to 3 short neutral policy draft option summaries for a concern', version: DRAFT_OPTIONS_PROMPT_VERSION, templateHash: draftOptionsTemplateHash(), preview: draftOptionsPromptTemplatePreview() } ];
}
