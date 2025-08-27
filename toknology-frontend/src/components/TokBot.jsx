import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "./Primitives.jsx";

function Bubble({ from = "bot", children }) {
  const base =
    "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ring-1 ring-black/5";
  return (
    <div className={`flex ${from === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={
          from === "user"
            ? `${base} bg-emerald-600 text-white`
            : `${base} bg-white text-zinc-800`
        }
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Floating, collapsible TokBot widget
 * Props:
 *  - regions: string[]
 *  - initialOpen?: boolean (default true)
 *  - hideOnMobile?: boolean (default true)
 */
export default function TokBot({ regions = ["global"], initialOpen = true, hideOnMobile = true }) {
  const [open, setOpen] = useState(initialOpen);
  const [messages, setMessages] = useState([
    { id: 1, role: "bot", text: "👋 Welcome to TokBot. Ask me about risks or obligations." },
  ]);
  const [input, setInput] = useState("");
  const lastRegionsKey = useRef("");

  const prettyRegions = useMemo(() => (regions || []).join(", "), [regions]);

  useEffect(() => {
    const key = JSON.stringify(regions || []);
    if (key && key !== lastRegionsKey.current) {
      lastRegionsKey.current = key;
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: `📌 Context updated → Regions: ${prettyRegions || "global"}`,
        },
      ]);
    }
  }, [prettyRegions, regions]);

  function push(role, text) {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role, text }]);
  }

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    push("user", text);
    setInput("");

    let reply = "I'll check your feature against the regulation pack.";
    if (/risk/i.test(text)) reply = "Consider data minimization, shorter retention, and tighter access control.";
    if (/obligation/i.test(text)) reply = "Likely obligations: age gates, parental consent (US states), DSAR handling (EU).";
    if (/export/i.test(text)) reply = "Use Export Evidence to generate the ZIP/HTML bundle.";

    push("bot", reply);
  }

  // Responsive visibility class
  const visibility = hideOnMobile ? "hidden lg:block" : "";

  // Closed (minimized) state
  if (!open) {
    return (
      <div className={`${visibility} fixed right-6 bottom-10 z-40`}>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2 shadow-lg hover:bg-emerald-700 active:translate-y-[1px]"
          aria-label="Open TokBot"
        >
          <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-white/20 text-xs font-bold">
            T
          </span>
          <span className="text-sm font-medium">TokBot</span>
        </button>
      </div>
    );
  }

  // Open chat panel
  return (
    <div className={`${visibility} fixed right-6 bottom-10 z-40 w-[300px]`}>
      <Card className="p-3 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-grid h-6 w-6 place-items-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
              T
            </span>
            <span className="text-sm font-medium">TokBot</span>
            <span className="ml-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">
              beta
            </span>
          </div>

          {/* Close button (X icon) */}
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition"
            title="Close TokBot"
            aria-label="Close TokBot"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 
                1.414L11.414 10l4.293 4.293a1 1 0 
                01-1.414 1.414L10 11.414l-4.293 
                4.293a1 1 0 01-1.414-1.414L8.586 
                10 4.293 5.707a1 1 0 
                010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="h-[50vh] overflow-y-auto space-y-2 pr-1">
          {messages.map((m) => (
            <Bubble key={m.id} from={m.role}>
              {m.text}
            </Bubble>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask TokBot…"
            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Send
          </button>
        </form>
      </Card>
    </div>
  );
}
