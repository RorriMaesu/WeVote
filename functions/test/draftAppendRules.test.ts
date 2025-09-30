// This test does not execute Firestore rules (needs emulator), but asserts the logical predicate we encoded.
// It mirrors the rule: newArray must be >= length and prefix must match.
function canAppend(oldArr: any[]|null, newArr: any[]|null) {
  if (oldArr == null) return true; // no prior state
  if (!Array.isArray(newArr)) return false;
  if (newArr.length < oldArr.length) return false;
  for (let i=0;i<oldArr.length;i++) {
    // shallow equality check (like == in rules JSON semantics). We'll stringify for simplicity.
    if (JSON.stringify(newArr[i]) !== JSON.stringify(oldArr[i])) return false;
  }
  return true;
}

describe('Draft citations/reviews append-only predicate (rule mirror)', () => {
  it('allows equal (no-op) or append', () => {
    expect(canAppend([{a:1}], [{a:1}])).toBe(true);
    expect(canAppend([{a:1}], [{a:1},{a:2}])).toBe(true);
  });
  it('rejects shrink', () => {
    expect(canAppend([{a:1},{a:2}], [{a:1}])).toBe(false);
  });
  it('rejects mutation of existing element', () => {
    expect(canAppend([{a:1}], [{a:9}])).toBe(false);
  });
  it('rejects reorder', () => {
    expect(canAppend([{id:1},{id:2}], [{id:2},{id:1}])).toBe(false);
  });
});
