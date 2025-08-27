
import React from 'react'
import { Card, Badge } from './Primitives.jsx'

export default function AgentPanel({ onRunSteps, stepState }) {
  const { ingested, mapped, obligations, aggregated } = stepState || {};
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold">Agentic Pipeline</h3>
      <p className="text-sm text-zinc-500">Run each step to see how multi‑agent analysis works (mocked).</p>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <AgentStep title="Doc Ingestor" ok={!!ingested} onRun={() => onRunSteps("ingest")} desc="Parse & chunk PRD/TRD" />
        <AgentStep title="Jurisdiction Mapper" ok={!!mapped} onRun={() => onRunSteps("map")} desc="Expand regions & scope" />
        <AgentStep title="Obligation Extractor" ok={!!obligations} onRun={() => onRunSteps("obligations")} desc="Find age, localization, reporting" />
        <AgentStep title="Decision Aggregator" ok={!!aggregated} onRun={() => onRunSteps("aggregate")} desc="Vote + confidence" />
      </div>
      <p className="mt-2 text-xs text-zinc-500">(In the full build, each tile would be a separate service/agent with its own prompt & weights.)</p>
    </Card>
  )
}

function AgentStep({ title, ok, onRun, desc }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-3 bg-white">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{title}</p>
        <Badge tone={ok ? "emerald" : "zinc"}>{ok ? "done" : "idle"}</Badge>
      </div>
      <p className="mt-2 text-sm text-zinc-700">{desc}</p>
      <button onClick={onRun} className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50">Run</button>
    </div>
  )
}
