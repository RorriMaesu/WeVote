// Logical test for chat rate limiter shape (mirrors draft limiter semantics but different cap)
interface RateLimitRecord { count: number; since: number; }
const rateLimits: Record<string, RateLimitRecord> = {};
class MockDoc { constructor(public key: string) {} async get(){ return { exists: !!rateLimits[this.key], data: ()=> rateLimits[this.key] }; } set(data:any){ rateLimits[this.key] = { ...(rateLimits[this.key]||{}), ...data }; return Promise.resolve(); } }
class MockCollection { doc(id:string){ return new MockDoc(id); } }
class MockDb { collection(name:string){ return new MockCollection(); } runTransaction(fn:any){ return fn({ get:(d:any)=> d.get(), set:(d:any,data:any)=> d.set(data) }); } }
const mockDb:any = new MockDb();

async function applyChatRateLimitTest(db:any, uid:string){
  const rlRef = db.collection('rate_limits').doc(`chat_${uid}`);
  await db.runTransaction(async (tx:any)=>{
    const snap = await tx.get(rlRef);
    const now = Date.now();
    const windowStart = now - 60*60*1000;
    let count = 0; let since = now;
    if (snap.exists){
      const data = snap.data(); count = data.count||0; since = data.since||now;
      if (since < windowStart){ count = 0; since = now; }
      if (count >= 60) throw new Error('resource-exhausted');
    }
    tx.set(rlRef, { count: count+1, since }, { merge: true });
  });
}

function reset(){ for (const k of Object.keys(rateLimits)) delete rateLimits[k]; }

describe('Chat rate limit helper (logical)', () => {
  beforeAll(()=> reset());
  it('allows first 60 and rejects 61st within window', async () => {
    for (let i=0;i<60;i++) await applyChatRateLimitTest(mockDb,'u1');
    await expect(applyChatRateLimitTest(mockDb,'u1')).rejects.toThrow('resource-exhausted');
  });
});
