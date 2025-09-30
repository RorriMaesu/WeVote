"use client";
import { useState, useEffect, useRef } from 'react';
import ThemeToggle from './theme-toggle';

// Central nav configuration so desktop & mobile stay in sync
const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/concern/new', label: 'Create Concern' },
  { href: '/ballots', label: 'Ballots' },
  { href: '/transparency', label: 'Transparency' },
  { href: '/verify', label: 'Verify' }
];

// Accessible focus trap helper for the temporary mobile menu
function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLDivElement>, onExit: () => void) {
  useEffect(() => {
    if (!active) return;
    const focusable = () => Array.from(containerRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) || []);
    const first = focusable()[0];
    const last = focusable().slice(-1)[0];
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onExit(); }
      if (e.key === 'Tab') {
        const items = focusable();
        if (items.length === 0) return;
        if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); items[0].focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    // initial focus
    setTimeout(()=> { first?.focus(); }, 0);
    return () => document.removeEventListener('keydown', handleKey);
  }, [active, containerRef, onExit]);
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef, () => setOpen(false));
  // Prevent body scroll when menu open
  useEffect(()=> {
    if (open) {
      const prevOverflow = document.body.style.overflow;
      const triggerEl = triggerRef.current; // capture for cleanup
      document.body.style.overflow='hidden';
      document.querySelectorAll('main, header ~ *').forEach(el => { (el as HTMLElement).inert = true; });
      return () => {
        document.body.style.overflow = prevOverflow;
        document.querySelectorAll('main, header ~ *').forEach(el => { (el as HTMLElement).inert = false; });
        triggerEl?.focus();
      };
    }
  }, [open]);
  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b bg-[var(--bg)]/80">
      <div className="max-w-7xl mx-auto flex items-center gap-4 py-3 px-4">
        <a href="#main" className="sr-only focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-brand-teal/40 px-2 py-1 rounded bg-white/70 dark:bg-black/40 text-xs">Skip to content</a>
        <span className="font-bold text-lg tracking-tight" style={{color:'var(--text)'}}>WeVote</span>
        {/* Desktop nav */}
        <nav className="hidden md:flex gap-5 text-sm text-muted" aria-label="Main navigation">
          {NAV_LINKS.map(l => (
            <a key={l.href} className="hover:text-[var(--text)] transition-colors" href={l.href}>{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto hidden md:flex gap-2 items-center">
          <ThemeToggle />
          <a href="/auth" className="btn-ghost">Sign In</a>
          <a href="/concern/new" className="btn-primary">Create Concern</a>
        </div>
        {/* Mobile actions */}
        <div className="ml-auto flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button ref={triggerRef} aria-label="Open menu" aria-expanded={open} aria-controls="mobile-nav-panel" onClick={()=> setOpen(o=>!o)} className="btn-ghost px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-teal/40">
            <span className="sr-only">Menu</span>
            <svg width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M3 6h14M3 12h14M3 18h14" /></svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-heading">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={()=> setOpen(false)} aria-hidden="true" />
          {/* Panel */}
          <div
            ref={panelRef}
            id="mobile-nav-panel"
            tabIndex={-1}
            className="absolute top-0 right-0 h-full w-72 max-w-[80%] flex flex-col p-5 gap-4 animate-slideIn
                       border-l shadow-xl overflow-y-auto text-[var(--text)] z-10
                       bg-[var(--panel-bg)] supports-[backdrop-filter]:bg-[var(--panel-bg)]/95
                       backdrop-blur-lg"
          >
            <div className="flex items-center justify-between pr-1">
              <h2 id="mobile-menu-heading" className="font-semibold tracking-tight text-sm">Menu</h2>
              <button onClick={()=> setOpen(false)} aria-label="Close menu" className="btn-ghost px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-teal/40">
                <svg width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M4 4l10 10M14 4L4 14" /></svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1 text-sm" aria-label="Mobile navigation">
              {NAV_LINKS.map(item => (
                <a
                  key={item.href}
                  onClick={()=> setOpen(false)}
                  href={item.href}
                  className="rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 transition-colors text-[var(--text)] hover:bg-[var(--hover)]"
                >{item.label}</a>
              ))}
              <div className="pt-2 mt-2 border-t border-[var(--border)]/60 flex flex-col gap-2">
                <a onClick={()=> setOpen(false)} href="/auth" className="btn-secondary text-center text-[13px] py-2">Sign In</a>
                <a onClick={()=> setOpen(false)} href="/concern/new" className="btn-primary text-center text-[13px] py-2">Create Concern</a>
              </div>
            </nav>
            <p className="mt-auto text-[10px] text-muted/80 pt-4">&copy; {new Date().getFullYear()} WeVote</p>
          </div>
          <style jsx>{`
            .animate-slideIn { animation: slideIn .28s cubic-bezier(.4,.08,.2,1); }
            @media (prefers-reduced-motion: reduce) { .animate-slideIn { animation: none; } }
            @keyframes slideIn { from { transform: translateX(35%); opacity:0; } to { transform: translateX(0); opacity:1; } }
          `}</style>
        </div>
      )}
    </header>
  );
}
