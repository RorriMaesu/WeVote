"use client";
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ThemeToggle from './theme-toggle';

// Central nav configuration so desktop & mobile stay in sync
const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/concern/new', label: 'Create Concern' },
  { href: '/ballots', label: 'Ballots' },
  { href: '/transparency', label: 'Transparency' },
  { href: '/verify', label: 'Verify' }
];

function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLDivElement>, onExit: () => void) {
  useEffect(() => {
    if (!active) return;
    const node = containerRef.current;
    const selectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getItems = () => Array.from(node?.querySelectorAll<HTMLElement>(selectors) || []);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onExit(); }
      if (e.key === 'Tab') {
        const items = getItems(); if (!items.length) return;
        const first = items[0]; const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    setTimeout(()=> { const first = getItems()[0]; first?.focus(); }, 0);
    return () => document.removeEventListener('keydown', handleKey);
  }, [active, containerRef, onExit]);
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(open, panelRef, () => setOpen(false));

  // Prevent body scroll
  useEffect(()=> {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow='hidden';
    const triggerEl = triggerRef.current;
    return () => { document.body.style.overflow = prev; triggerEl?.focus(); };
  }, [open]);

  const portal = (open && typeof document !== 'undefined') ? createPortal(
    <div className="fixed inset-0 z-[999]" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-heading" data-menu-root>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={()=> setOpen(false)} aria-hidden="true" />
      <div
        ref={panelRef}
        id="mobile-nav-panel"
        tabIndex={-1}
        className="fixed top-0 right-0 h-full w-72 max-w-[82%] flex flex-col p-5 gap-4 shadow-xl overflow-y-auto text-[var(--text)] bg-[var(--panel-bg)] border-l border-[var(--border)]"
      >
        <div className="flex items-center justify-between pr-1">
          <h2 id="mobile-menu-heading" className="font-semibold tracking-tight text-sm">Menu</h2>
          <button onClick={()=> setOpen(false)} aria-label="Close menu" className="btn-ghost px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-teal/40">
            <svg width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M4 4l10 10M14 4L4 14" /></svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1 text-sm" aria-label="Mobile navigation">
          {NAV_LINKS.map(item => (
            <a key={item.href} onClick={()=> setOpen(false)} href={item.href} className="rounded px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal/40 transition-colors text-[var(--text)] hover:bg-[var(--hover)]">
              {item.label}
            </a>
          ))}
          <div className="pt-3 mt-3 border-t border-[var(--border)]/60 flex flex-col gap-2">
            <a onClick={()=> setOpen(false)} href="/auth" className="btn-secondary text-center text-[13px] py-2">Sign In</a>
            <a onClick={()=> setOpen(false)} href="/concern/new" className="btn-primary text-center text-[13px] py-2">Create Concern</a>
          </div>
        </nav>
        <p className="mt-auto text-[10px] text-muted/80 pt-4">&copy; {new Date().getFullYear()} WeVote</p>
      </div>
    </div>, document.body) : null;

  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto flex items-center gap-4 py-3 px-4">
        <a href="#main" className="sr-only focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-brand-teal/40 px-2 py-1 rounded bg-white/70 dark:bg-black/40 text-xs">Skip to content</a>
        <span className="font-bold text-lg tracking-tight" style={{color:'var(--text)'}}>WeVote</span>
        <nav className="hidden md:flex gap-5 text-sm text-muted" aria-label="Main navigation">
          {NAV_LINKS.map(l => <a key={l.href} className="hover:text-[var(--text)] transition-colors" href={l.href}>{l.label}</a>)}
        </nav>
        <div className="ml-auto hidden md:flex gap-2 items-center">
          <ThemeToggle />
          <a href="/auth" className="btn-ghost">Sign In</a>
          <a href="/concern/new" className="btn-primary">Create Concern</a>
        </div>
        <div className="ml-auto flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button ref={triggerRef} aria-label="Open menu" aria-expanded={open} aria-controls="mobile-nav-panel" onClick={()=> setOpen(o=>!o)} className="btn-ghost px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-teal/40">
            <span className="sr-only">Menu</span>
            <svg width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M3 6h14M3 12h14M3 18h14" /></svg>
          </button>
        </div>
      </div>
      {portal}
    </header>
  );
}
