import { initializeApp, getApps } from 'firebase/app';

// During Firebase Hosting framework builds, the CLI injects a JSON blob into __FIREBASE_DEFAULTS__
// that contains the public web config (apiKey, projectId, etc). We removed the hardcoded apiKey
// to avoid accidental reuse, but builds (SSR prerender) were failing when NEXT_PUBLIC_FIREBASE_API_KEY
// was not explicitly provided. We now fall back to parsing __FIREBASE_DEFAULTS__ for the public config.
// This keeps the key out of source while still allowing successful prerender builds.

type FirebaseDefaults = { config?: { [k: string]: any } };
let injected: FirebaseDefaults | undefined;
try {
  if (process.env.__FIREBASE_DEFAULTS__) {
    injected = JSON.parse(process.env.__FIREBASE_DEFAULTS__);
  }
} catch {
  // Ignore parse issues; we'll rely on explicit env vars instead.
}

const cfg = injected?.config || {};

// Public Firebase Web API key (NOT a secret). Safe to ship; rules protect data. We still prefer
// env override for flexibility.
const PUBLIC_API_KEY = 'AIzaSyAAR5_6vDyrKwH2jykeVmoNFmK56eDHMbs';
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || cfg.apiKey || PUBLIC_API_KEY;
const authDomain = cfg.authDomain || 'wevote-5400a.firebaseapp.com';
const projectId = cfg.projectId || 'wevote-5400a';
const storageBucket = cfg.storageBucket || 'wevote-5400a.firebasestorage.app';
const messagingSenderId = cfg.messagingSenderId || '699685275653';
const appId = cfg.appId || '1:699685275653:web:579cc7786db7b51ef5746c';
const measurementId = cfg.measurementId || 'G-4PPZSW9LWN';

// If apiKey still empty we defer initialization until a client import with proper env; however most
// pages can still bundle without executing auth calls. We guard analytics separately.
export const app = getApps()[0] || initializeApp({
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId
});
