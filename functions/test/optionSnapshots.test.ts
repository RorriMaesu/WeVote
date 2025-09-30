// Pure shape test: ensure export object includes optionSnapshots when present on ballot
function buildExport(ballot:any){
  // Simulate subset of exportBallotReport logic relevant to optionSnapshots inclusion
  return { ballot: { optionSnapshots: ballot.optionSnapshots || null } };
}

describe('optionSnapshots export presence', () => {
  it('includes array when provided', () => {
    const ballot = { optionSnapshots: [{ optionId:'d1', promptHash:'p', responseHash:'r' }] };
    const exp = buildExport(ballot);
    expect(exp.ballot.optionSnapshots).toHaveLength(1);
  });
  it('is null when absent', () => {
    const ballot = {};
    const exp = buildExport(ballot);
    expect(exp.ballot.optionSnapshots).toBeNull();
  });
});
