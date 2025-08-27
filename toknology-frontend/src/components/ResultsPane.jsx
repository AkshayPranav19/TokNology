
import React from 'react'
import { Card, Chip, Badge } from './Primitives.jsx'

const ALL_REGULATIONS=[
  { id: 'dsa', name: 'EU Digital Services Act (DSA)' },
  { id: 'ca', name: 'CA Protecting Our Kids from Social Media Addiction' },
  { id: 'fl', name: 'Florida Online Protections for Minors' },
  { id: 'ut', name: 'Utah Social Media Regulation Act' },
  { id: 'ncmec', name: 'US NCMEC Reporting (CSAM)' },
];

export default function ResultsPane({ regions, result }) {
  const decisionColor = !result ? 'zinc' : result.decision === 'Yes' ? 'emerald' : result.decision === 'No' ? 'zinc' : 'amber';
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Decision</h3>
          <p className="text-sm text-zinc-500">Needs geo‑specific compliance logic?</p>
        </div>
        <Chip color={decisionColor}>{result ? `${result.decision} • ${(result.confidence*100).toFixed(0)}%` : 'Awaiting analysis'}</Chip>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-zinc-500">Regions</p>
          <p className="text-sm mt-1">{regions.length ? regions.join(', ') : '—'}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-zinc-500">Regulations Hit</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {(result?.regs || []).length ? result.regs.map(id => (
              <Badge key={id}>{ALL_REGULATIONS.find(r => r.id===id)?.name || id}</Badge>
            )) : <span className="text-sm">—</span>}
          </div>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-zinc-500">Risk Score</p>
          <div className="mt-2">
            <div className="h-2 w-full rounded-full bg-zinc-200">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, result?.risk ?? 0)}%` }} />
            </div>
            <p className="mt-1 text-sm">{result?.risk ?? 0}/100</p>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium">Why (with citations)</p>
        <ul className="mt-2 space-y-2">
          {(result?.citations || []).map((c, idx) => (
            <li key={idx} className="rounded-lg border border-zinc-200 p-3 text-sm bg-zinc-50">
              <span className="font-medium text-zinc-700">{c.reg}:</span> <span className="text-zinc-700">“{c.quote}”</span>
            </li>
          ))}
          {(!result || (result?.citations || []).length === 0) && (
            <li className="text-sm text-zinc-500">Run an analysis to see rationales and citations.</li>
          )}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <p className="text-sm font-medium">Obligations</p>
        <div className="flex flex-wrap gap-2">
          {(result?.obligations || []).map((o) => (
            <Chip key={o} color={{age_gate:'amber',data_localization:'sky',reporting:'rose',notice:'violet',consent:'emerald'}[o] || 'slate'}>{({age_gate:'Age Gate',data_localization:'Data Localization',reporting:'Reporting',notice:'Notice',consent:'Consent'})[o] || o}</Chip>
          ))}
          {(result?.obligations || []).length === 0 && <span className="text-sm text-zinc-500">—</span>}
        </div>
      </div>

      {result?.clarifying?.length ? (
        <div className="mt-4">
          <p className="text-sm font-medium">Clarifying Questions</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700 space-y-1">
            {result.clarifying.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}
