import { buildRollingSummary, partitionForSummary } from '../src/summarizer';

describe('rolling summary compression', () => {
  it('partitions and summarizes older messages', () => {
    const msgs = [] as { role: string; text: string }[];
    for (let i=0;i<25;i++) msgs.push({ role: i%2===0? 'user':'assistant', text: `Message number ${i}. Additional context sentence.`});
    const { toSummarize, tail } = partitionForSummary(msgs, 10);
    expect(toSummarize.length).toBe(15);
    expect(tail.length).toBe(10);
    const { summary, covered } = buildRollingSummary(toSummarize);
    expect(covered).toBeGreaterThan(5);
    expect(summary).toContain('Condensed summary');
  });

  it('skips summary when few messages', () => {
    const msgs = Array.from({length:5}, (_,i)=>({ role: 'user', text: `Short ${i}.` }));
    const { toSummarize } = partitionForSummary(msgs, 12);
    expect(toSummarize.length).toBe(0);
  });
});
