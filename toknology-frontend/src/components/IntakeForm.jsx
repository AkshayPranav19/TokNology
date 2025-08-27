
import React from 'react'
import { Card, SectionTitle } from './Primitives.jsx'

const REGION_PRESETS=[
  { id: 'eu', label: 'European Union' },
  { id: 'us-ca', label: 'California' },
  { id: 'us-fl', label: 'Florida' },
  { id: 'us-ut', label: 'Utah' },
  { id: 'global', label: 'Global' },
];

export default function IntakeForm({ title, setTitle, desc, setDesc, files, setFiles, regions, toggleRegion, onAnalyze, onGenerateEvidence, caseLocked, onCloseCase }) {
  const handleFiles = (e) => {
    if (caseLocked) {
      alert('Close current case before uploading new documents.');
      e.target.value = '';
      return;
    }
    const list = Array.from(e.target.files || []);
    setFiles(list);
  };
  return (
    <Card className="p-4">
      <SectionTitle title="Feature Intake" subtitle="Provide the artifacts described in the hackathon brief." />
      <label className="block text-sm font-medium text-zinc-700">Feature Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Location‑aware Content Download" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled={caseLocked} />

      <label className="mt-4 block text-sm font-medium text-zinc-700">Feature Description</label>
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} placeholder="Describe what the feature does. Mention age targeting, location usage, storage, sharing, etc." className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled={caseLocked} />

      <label className="mt-4 block text-sm font-medium text-zinc-700">Upload PRD/TRD or Policy Docs (optional)</label>
      <div className="mt-1">
        <input type="file" multiple onChange={handleFiles} disabled={caseLocked} className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-zinc-700 hover:file:bg-zinc-200 disabled:opacity-50" />
        {files?.length ? (
          <p className="mt-1 text-xs text-zinc-500">{files.length} file(s) selected</p>
        ) : (
          <p className="mt-1 text-xs text-zinc-400">No files selected</p>
        )}
      </div>

      <label className="mt-4 block text-sm font-medium text-zinc-700">Regions</label>
      <div className="mt-1 flex flex-wrap gap-2">
        {REGION_PRESETS.map(r => (
          <button key={r.id} onClick={() => !caseLocked && toggleRegion(r.id)} className={`rounded-full border px-3 py-1 text-xs ${regions.includes(r.id) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'} ${caseLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>{r.label}</button>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button onClick={onAnalyze} disabled={caseLocked} className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50">Analyze</button>
        <button onClick={onGenerateEvidence} className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50">Generate Evidence (mock)</button>
        {caseLocked && (
          <button onClick={onCloseCase} className="rounded-lg bg-amber-600 text-white px-4 py-2 text-sm hover:bg-amber-700">Close Case & New Upload</button>
        )}
      </div>
    </Card>
  );
}
