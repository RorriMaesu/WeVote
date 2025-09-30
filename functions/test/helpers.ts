// Lightweight in-memory mocks for logic-level tests
interface RateLimitRecord { count: number; since: number; }
const rateLimits: Record<string, RateLimitRecord> = {};

// Mock Firestore subset used by applyDraftRateLimit
class MockDoc {
  constructor(public key: string) {}
  async get() { return { exists: !!rateLimits[this.key], data: () => rateLimits[this.key] }; }
  set(data: any) { rateLimits[this.key] = { ...(rateLimits[this.key]||{}), ...data }; return Promise.resolve(); }
}
class MockCollection { doc(id: string) { return new MockDoc(id); } }
class MockDb { collection(name: string) { return new MockCollection(); } runTransaction(fn: any) { return fn({ get: (d: any)=> d.get(), set: (d:any,data:any,opts:any)=> d.set(data) }); } }

export const mockDb: any = new MockDb();

export function resetDb() { for (const k of Object.keys(rateLimits)) delete rateLimits[k]; }

// Re-implement simplified rate limit logic mirroring applyDraftRateLimit for isolation
export async function testApplyDraftRateLimit(uid: string) {
  const rlRef = mockDb.collection('rate_limits').doc(`drafts_${uid}`);
  await mockDb.runTransaction(async (tx: any) => {
    const snap = await tx.get(rlRef);
    const now = Date.now();
    const windowStart = now - 60*60*1000;
    let count = 0; let since = now;
    if (snap.exists) {
      const data = snap.data();
      count = data.count || 0;
      since = data.since || now;
      if (since < windowStart) { count = 0; since = now; }
      if (count >= 10) throw new Error('resource-exhausted');
    }
    tx.set(rlRef, { count: count + 1, since }, { merge: true });
  });
}
