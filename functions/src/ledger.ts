import { createHash } from 'crypto';

export interface LedgerData {
  kind: string; // e.g. 'tally'
  ballotId?: string;
  results?: any;
  ts: number; // millis
}

export interface LedgerCanonical {
  seq: number;
  prevHash: string | null;
  data: LedgerData;
}

export function buildCanonical(seq: number, prevHash: string | null, data: LedgerData): { canonical: string; entryHash: string } {
  const canonicalObj: LedgerCanonical = { seq, prevHash, data };
  const canonical = JSON.stringify(canonicalObj);
  const entryHash = createHash('sha256').update(canonical).digest('hex');
  return { canonical, entryHash };
}
