
import React from 'react'
import { Badge } from './Primitives.jsx'

export default function LearningDrawer({ show, onClose, comments }) {
  return (
    <div className={`fixed right-0 top-0 h-full w-full sm:w-[420px] border-l border-zinc-200 bg-white shadow-xl transition-transform duration-300 ${show ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
        <div>
          <h3 className="font-semibold">Learning Log</h3>
          <p className="text-xs text-zinc-500">What the system would learn from your feedback</p>
        </div>
        <button onClick={onClose} className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-sm">Close</button>
      </div>
      <div className="p-4 space-y-3 overflow-auto h-[calc(100%-52px)]">
        {comments.length === 0 && (
          <p className="text-sm text-zinc-500">No feedback yet. Cast votes or submit a note.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl border border-zinc-200 p-3">
            <div className="flex items-center justify-between">
              <Badge tone={c.vote > 0 ? 'emerald' : 'rose'}>{c.vote > 0 ? 'Upvote' : 'Downvote'}</Badge>
              <span className="text-xs text-zinc-400">{new Date(c.id).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Tag</p>
            <p className="text-sm">{c.tag}</p>
            {c.note && <>
              <p className="mt-1 text-xs text-zinc-500">Note</p>
              <p className="text-sm">{c.note}</p>
            </>}
            <div className="mt-2 text-xs text-zinc-500">(In a full build, this would adjust agent weights and prompt memory.)</div>
          </div>
        ))}
      </div>
    </div>
  )
}
