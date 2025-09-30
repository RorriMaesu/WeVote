import { applyCitationRateLimit, applyReviewRateLimit } from '../src/index';

// We'll mock a minimal Firestore-like interface similar to helpers pattern
class MockDoc { constructor(public key: string, private store: any) {} async get(){ return { exists: this.key in this.store, data: ()=> this.store[this.key] }; } set(data:any){ this.store[this.key] = { ...(this.store[this.key]||{}), ...data }; return Promise.resolve(); } }
class MockCollection { constructor(private store:any){} doc(id:string){ return new MockDoc(id,this.store); } }
class MockDb { private store: Record<string,any> = {}; collection(name:string){ return new MockCollection(this.store); } runTransaction(fn:any){ return fn({ get:(d:any)=> d.get(), set:(d:any,data:any)=> d.set(data) }); } }

const db: any = new MockDb();

function many(n:number, fn:()=>Promise<any>) { return Promise.all(Array.from({length:n}).map(()=> fn())); }

describe('Citation & Review rate limits', () => {
    it('blocks after exceeding global citation limit', async () => {
      // Use distinct draft ids so we test the global cap (20) not the per-draft cap (5)
      for (let i=0;i<20;i++) await applyCitationRateLimit(db,'u1',`gd${i}`); // 20 allowed globally
      await expect(applyCitationRateLimit(db,'u1','gd_extra`')).rejects.toThrow(/Citation rate limit/); // 21st blocked
    });
  it('blocks after per-draft citation limit', async () => {
    // new user resets store logically via different uid
    for (let i=0;i<5;i++) await applyCitationRateLimit(db,'u2','dX');
    await expect(applyCitationRateLimit(db,'u2','dX')).rejects.toThrow(/Citation rate limit/);
  });
    it('blocks after exceeding global review limit', async () => {
      for (let i=0;i<10;i++) await applyReviewRateLimit(db,'u3',`rd${i}`); // 10 allowed globally across drafts
      await expect(applyReviewRateLimit(db,'u3','rd_extra')).rejects.toThrow(/Review rate limit/); // 11th blocked
    });
  it('blocks after per-draft review limit', async () => {
    for (let i=0;i<2;i++) await applyReviewRateLimit(db,'u4','d2');
    await expect(applyReviewRateLimit(db,'u4','d2')).rejects.toThrow(/Review rate limit/);
  });
});
