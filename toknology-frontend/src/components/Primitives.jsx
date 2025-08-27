
import React from 'react'

export const Chip = ({ children, color = "slate" }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-${color}-100 text-${color}-800 border border-${color}-200`}>{children}</span>
);
export const Badge = ({ children, tone = "zinc" }) => (
  <span className={`inline-block rounded-md border border-${tone}-300 bg-${tone}-50 px-2 py-0.5 text-xs text-${tone}-700`}>{children}</span>
);
export const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-zinc-200 bg-white shadow-sm ${className}`}>{children}</div>
);
export const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-3">
    <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
    {subtitle ? <p className="text-sm text-zinc-500">{subtitle}</p> : null}
  </div>
);
