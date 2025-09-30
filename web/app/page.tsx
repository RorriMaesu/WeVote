import Link from 'next/link';

export default function HomePage() {
  const features = [
    { title: 'Chat & Ideate', desc: 'Describe problems quickly. An assistant helps shape clear civic concerns.'},
    { title: 'Draft Together', desc: 'Generate options, iterate transparently, track provenance and reviews.'},
    { title: 'Vote & Audit', desc: 'Rank options, get cryptographic receipts, inspect public tally logs.'}
  ];
  return (
    <div className="space-y-12">
      <section className="text-center pt-12 pb-16 sm:pt-16">
        <h1 className="h1-responsive font-bold mb-5 bg-gradient-to-r from-brand-teal via-brand-sky to-brand-navy bg-clip-text text-transparent">WeVote — Draft. Debate. Decide.</h1>
        <p className="text-muted max-w-2xl mx-auto mb-7 text-sm sm:text-base leading-relaxed px-2">A trustworthy, auditable public square where people draft, debate, and vote on policy proposals refined into well-sourced civic drafts.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          <Link href="/concern/new" className="btn-primary w-full sm:w-auto">Get Started</Link>
          <Link href="/feed" className="px-4 py-2 border border-base rounded-lg text-sm hover:bg-surface hover:shadow-card transition w-full sm:w-auto">Explore Feed</Link>
        </div>
      </section>
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((c,i) => (
          <div key={c.title} className="card relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-brand-teal/5 via-transparent to-brand-sky/5" />
            <div className="relative">
              <h3 className="font-semibold mb-1 text-sm tracking-tight">{c.title}</h3>
              <p className="text-[13px] text-muted leading-relaxed line-clamp-3">{c.desc}</p>
            </div>
            <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-muted">{String(i+1).padStart(2,'0')}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
