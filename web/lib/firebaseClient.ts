import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { app } from './firebaseClientInternal';

// All config resolution happens in firebaseClientInternal (explicit env var -> injected defaults).
// We intentionally avoid re-specifying the config here to prevent copy drift.

if (typeof window !== 'undefined') {
  isSupported().then(ok => { if (ok) try { getAnalytics(app); } catch { /* analytics optional */ } });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
