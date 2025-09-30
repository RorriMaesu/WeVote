import { validateDelegationTopic, computeReputationIncrementForReview } from '../src/index';

describe('delegations', () => {
  it('validates topic slugs', () => {
    expect(validateDelegationTopic('transport')).toBe(true);
    expect(validateDelegationTopic('t')).toBe(false); // too short
    expect(validateDelegationTopic('UPPER')).toBe(false); // uppercase invalid
    expect(validateDelegationTopic('valid_topic-123')).toBe(true);
    expect(validateDelegationTopic('waytoolongtopicnamethatisoverthirtytwochars')).toBe(false);
  });
});

describe('reputation increments', () => {
  it('increments only for recognized review kinds', () => {
    expect(computeReputationIncrementForReview('legal')).toBe(1);
    expect(computeReputationIncrementForReview('fact')).toBe(1);
    expect(computeReputationIncrementForReview('expert')).toBe(1);
    expect(computeReputationIncrementForReview('other')).toBe(0);
  });
});