'use client';

/**
 * components/Nav.tsx
 * ---------------------------------------------------------------------------
 * The organizational spine of the interface. Top section is the platform
 * (Command Center, Platform Memory, Quality Assurance, Marketplace).
 * Bottom section is the org chart — Engineering is the only department
 * that exists yet. The full researched list of ~40 not-yet-created
 * departments (spanning every core business function, not just the 8
 * originally named) lives in the Command Center's Create Department
 * dropdown rather than the sidebar — a flat list that long doesn't belong
 * in a persistent nav rail.
 * ---------------------------------------------------------------------------
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KNOWN_DEPARTMENTS } from '../lib/types';

const PLATFORM_LINKS = [
  { href: '/', label: 'Command Center', icon: '◆' },
  { href: '/engineering', label: 'Engineering Workspace', icon: '⚙' },
  { href: '/memory', label: 'Platform Memory', icon: '◈' },
  { href: '/quality', label: 'Quality Assurance', icon: '✓' },
  { href: '/marketplace', label: 'Marketplace', icon: '▤' }
];

const NOT_CREATED_COUNT = KNOWN_DEPARTMENTS.filter((d) => d.status === 'NOT_CREATED').length;

export default function Nav() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] shrink-0 border-r border-base-700 bg-base-950 px-4 py-5 flex flex-col">
      <div className="flex items-center gap-2.5 px-1 mb-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-white font-bold text-xs">
          AI
        </div>
        <div>
          <div className="text-[13px] font-semibold leading-tight">AIBAOS</div>
          <div className="text-[10.5px] text-ink-muted leading-tight">Executive Headquarters</div>
        </div>
      </div>

      <div className="text-[10.5px] uppercase tracking-widest text-ink-faint px-2 mb-2">Platform</div>
      <nav className="flex flex-col gap-0.5 mb-8">
        {PLATFORM_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname === link.href ? 'active' : ''}`}
          >
            <span className="w-4 text-center opacity-70">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="text-[10.5px] uppercase tracking-widest text-ink-faint px-2 mb-2">Departments</div>
      <nav className="flex flex-col gap-0.5">
        <Link href="/engineering" className={`nav-link ${pathname === '/engineering' ? 'active' : ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-good shadow-[0_0_6px_theme(colors.good.DEFAULT)] ml-1 mr-1.5" />
          Engineering
        </Link>

        <Link href="/" className="nav-link justify-between text-left opacity-70 hover:opacity-100">
          <span className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-base-600 ml-1 mr-0" />
            {NOT_CREATED_COUNT} more available
          </span>
          <span className="text-[9.5px] text-ink-faint">Create →</span>
        </Link>
      </nav>

      <div className="mt-auto pt-6 px-2 text-[10.5px] text-ink-faint leading-relaxed">
        Engineering builds every department.
        <br />Certified by the Quality Assurance Director.
      </div>
    </aside>
  );
}
