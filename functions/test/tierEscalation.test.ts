function canSetTier(isAdmin: boolean, newTier: string): boolean {
  const allowed = ['basic','verified','expert','admin'];
  if (!allowed.includes(newTier)) return false;
  return isAdmin; // simplified gating
}

describe('Tier escalation gating (logical)', () => {
  it('blocks non-admin tier change', () => {
    expect(canSetTier(false, 'verified')).toBe(false);
  });
  it('allows admin tier change', () => {
    expect(canSetTier(true, 'verified')).toBe(true);
  });
});
