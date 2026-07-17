'use client';

/**
 * app/marketplace/page.tsx — Marketplace
 * ---------------------------------------------------------------------------
 * Every activated department automatically generates a distributable
 * Marketplace ZIP package (builders/package-builder.js + adapters/archiver.js
 * on the backend). This page lists what Engineering has actually produced
 * on disk — no placeholder catalog entries.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react';
import type { MarketplacePackage } from '../../lib/types';

export default function Marketplace() {
  const [packages, setPackages] = useState<MarketplacePackage[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch('/api/marketplace');
      const data = await res.json();
      if (!cancelled) setPackages(data.packages);
    }
    load();
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <main className="px-8 py-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-[19px] font-semibold">Marketplace</h1>
        <p className="text-ink-muted text-[13px] mt-0.5">
          Distributable packages for every department Engineering has activated.
        </p>
      </header>

      {packages.length === 0 ? (
        <div className="panel p-10 text-center text-ink-faint text-[12.5px]">
          No packages generated yet. Every department Engineering activates automatically produces a
          <span className="font-mono text-ink-muted"> DepartmentName-Version.zip</span> here.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.name} className="panel p-4">
              <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center text-accent font-bold text-xs mb-3">
                ZIP
              </div>
              <div className="text-[13.5px] font-semibold text-ink font-mono break-all">{pkg.name}</div>
              <div className="flex items-center justify-between mt-3 text-[11px] text-ink-faint">
                <span>{formatSize(pkg.sizeBytes)}</span>
                <span>{new Date(pkg.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
