#!/usr/bin/env node
/**
 * Offline verification CLI.
 * Usage:
 *  node dist/verify/cli.js --ballot export.json --ledger ledger.json
 * Where export.json is object from exportBallotReport (export field) and ledger.json is array of ledger entries.
 */
import { createHash } from 'crypto';
import * as fs from 'fs';

interface LedgerEntry { seq: number; prevHash: string|null; entryHash: string; canonical?: string; }

function loadJSON(path?: string) { if (!path) return null; return JSON.parse(fs.readFileSync(path,'utf8')); }

function verifyLedger(entries: LedgerEntry[]) {
  const issues: string[] = [];
  for (let i=0;i<entries.length;i++) {
    const e = entries[i];
    if (e.canonical) {
      const h = createHash('sha256').update(e.canonical).digest('hex');
      if (h !== e.entryHash) issues.push(`Hash mismatch seq ${e.seq}`);
    }
    if (i>0) {
      const prev = entries[i-1];
      if (e.prevHash !== prev.entryHash) issues.push(`Chain link mismatch at seq ${e.seq}`);
    } else if (e.prevHash !== null) {
      issues.push('First entry prevHash should be null');
    }
  }
  return { ok: issues.length===0, issues };
}

function verifyBallot(exportObj: any) {
  if (!exportObj?.ballot) return { ok:false, issue:'Missing ballot key'};
  const { ballot } = exportObj;
  const recompute = createHash('sha256').update(JSON.stringify({ ballotId: ballot.ballotId, type: ballot.type, results: ballot.results })).digest('hex');
  const tallyHashMatches = recompute === ballot.tallyHash;
  return { ok: tallyHashMatches, recomputed: recompute, stored: ballot.tallyHash };
}

function main() {
  const args = process.argv.slice(2);
  const get = (flag: string) => { const i = args.indexOf(flag); return i>=0? args[i+1]: undefined; };
  const ballotPath = get('--ballot');
  const ledgerPath = get('--ledger');
  if (!ballotPath) {
    console.error('Usage: verify --ballot export.json [--ledger ledger.json]');
    process.exit(1);
  }
  const expRoot = loadJSON(ballotPath);
  const exportObj = expRoot.export || expRoot; // allow wrapper or direct
  const ballotRes = verifyBallot(exportObj);
  console.log('Ballot tally hash valid:', ballotRes.ok, `(stored=${ballotRes.stored}, recomputed=${ballotRes.recomputed})`);
  if (ledgerPath) {
    const ledgerEntries = loadJSON(ledgerPath);
    const ledgerRes = verifyLedger(ledgerEntries);
    console.log('Ledger chain valid:', ledgerRes.ok);
    if (!ledgerRes.ok) ledgerRes.issues.forEach(i=> console.log(' -', i));
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('/cli.js')) {
  try { main(); } catch (e:any) { console.error('Verification failed', e.message); process.exit(2); }
}
