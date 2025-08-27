
import React from 'react'
import { Card } from './Primitives.jsx'

export default function FeedbackPane({ onSubmitFeedback, onQuickVote }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Feedback (improves future results)</h3>
          <p className="text-sm text-zinc-500">Vote and tag the decision; page returns to original view after submission.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onQuickVote(+1, 'Good Reasoning', 'Looks correct')} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">👍 Upvote</button>
          <button onClick={() => onQuickVote(-1, 'Wrong Reg', 'Not a DSA case')} className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm text-rose-700">👎 Downvote</button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input id="tag" placeholder="Tag (e.g., Missing Age-Gate)" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <input id="note" placeholder="Note (optional)" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <button onClick={() => {
          const tag = document.getElementById('tag').value || 'General';
          const note = document.getElementById('note').value || '';
          onSubmitFeedback(+1, tag, note);
        }} className="md:col-span-2 rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm hover:bg-zinc-800">Submit Feedback</button>
      </div>
    </Card>
  )
}
