
import React, { useState } from 'react'
import IntakeForm from './components/IntakeForm.jsx'
import ResultsPane from './components/ResultsPane.jsx'
import FeedbackPane from './components/FeedbackPane.jsx'
import LearningDrawer from './components/LearningDrawer.jsx'
import TokBot from './components/TokBot.jsx';
import AuditLog from './components/AuditLog.jsx'
import { Card, SectionTitle } from './components/Primitives.jsx'
import useDummyAnalyzer from './hooks/useDummyAnalyzer.js'
import { exportCSV, exportEvidenceHTML } from './utils/exports.js'

const ALL_REGULATIONS=[
  { id: 'dsa', name: 'EU Digital Services Act (DSA)' },
  { id: 'ca', name: 'CA Protecting Our Kids from Social Media Addiction' },
  { id: 'fl', name: 'Florida Online Protections for Minors' },
  { id: 'ut', name: 'Utah Social Media Regulation Act' },
  { id: 'ncmec', name: 'US NCMEC Reporting (CSAM)' },
];

function Header({ onToggleLearning, onDownloadZip }) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-zinc-200">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-emerald-500 text-white grid place-items-center font-black">T</div>
          <div>
            <h1 className="text-lg font-semibold">TokNology</h1>
            <p className="text-xs text-zinc-500 -mt-0.5">From Guesswork to Governance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleLearning} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50">Learning Log</button>
          <button onClick={onDownloadZip} className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-sm hover:bg-emerald-700">Download ZIP</button>
        </div>
      </div>
    </header>
  )
}

export default function App() {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [regions, setRegions] = useState(['global'])
  const [files, setFiles] = useState([])
  const [result, setResult] = useState(null)
  const [comments, setComments] = useState([])
  const [showLearning, setShowLearning] = useState(false)
  const [stepState, setStepState] = useState({})

  const analyze = useDummyAnalyzer()
  const caseLocked = !!result
  const toggleRegion = (id) => setRegions((r)=> r.includes(id) ? r.filter(x=>x!==id) : [...r,id])

  function resetToInitial() {
    setTitle(''); setDesc(''); setRegions(['global']); setFiles([]); setResult(null); setStepState({}); setShowLearning(false);
  }

  function onAnalyze(){
    if(!title.trim() || !desc.trim()){ alert('Please enter a Feature Title and Description.'); return; }
    const out = analyze({ title, description: desc, regions, files })
    setResult(out)
  }

  function onSubmitFeedback(vote, tag, note){
    setComments((prev)=> [{ id: Date.now(), vote, tag, note }, ...prev])
    resetToInitial() // refresh to original after feedback
  }
  const onQuickVote = onSubmitFeedback

  function onRunSteps(kind){
    if (kind==='ingest') setStepState(s=>({...s, ingested:{chunks: Math.floor(Math.random()*6)+4}}))
    if (kind==='map') setStepState(s=>({...s, mapped:{expanded: regions.includes('eu')? ['FR','DE','ES'] : regions}}))
    if (kind==='obligations') setStepState(s=>({...s, obligations:{items:['age_gate','data_localization'].slice(0, Math.floor(Math.random()*2)+1)}}))
    if (kind==='aggregate') { const out = analyze({ title, description: desc, regions, files }); setResult(out); setStepState(s=>({...s, aggregated:{ decision: out.decision, conf: out.confidence }})) }
  }

  function onDownloadZip(){
    const a = document.createElement('a'); a.href = 'sandbox:/mnt/data/toknology-frontend.zip'; a.download='toknology-frontend.zip'; a.click();
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white text-zinc-900">
      <Header onToggleLearning={()=>setShowLearning(s=>!s)} onDownloadZip={onDownloadZip} />
      <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <IntakeForm title={title} setTitle={setTitle} desc={desc} setDesc={setDesc} files={files} setFiles={setFiles} regions={regions} toggleRegion={toggleRegion} onAnalyze={onAnalyze} onGenerateEvidence={()=>exportEvidenceHTML({ title, regions, result })} caseLocked={caseLocked} onCloseCase={resetToInitial} />
          <Card className="p-4">
            <SectionTitle title="Regulation Pack (included)" subtitle="Model compares your feature against these regs." />
            <ul className="space-y-2">
              {ALL_REGULATIONS.map(r => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700">{r.name}</span>
                  <span className="inline-block rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">active</span>
                </li>
              ))}
            </ul>
          </Card>
          {/* <Audit onRunSteps={onRunSteps} stepState={stepState} /> */}
        </div>
        <div className="lg:col-span-2 space-y-6">
          <ResultsPane regions={regions} result={result} />
          <FeedbackPane onSubmitFeedback={onSubmitFeedback} onQuickVote={onQuickVote} />
            <AuditLog 
            title={title}
            regions={regions}
            result={result}
            comments={comments}
            initialLimit={5}
          />
        </div>
      </main>
        <div className="fixed right-6 bottom-20 hidden lg:block">
    <TokBot regions={regions} />
  </div>
      <LearningDrawer show={showLearning} onClose={()=>setShowLearning(false)} comments={comments} />
      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-xs text-zinc-500">© 2025 TokNology (frontend mock). Demo shows case close, agent steps, feedback reset, and export flows.</footer>
    </div>
  )
}
