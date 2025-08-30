import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card } from "./Primitives.jsx";
import ReactMarkdown from "react-markdown";

function Bubble({ from = "bot", children }) {
  const base =
    "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ring-1 ring-black/5";
  const isBot = from !== "user";

  // Check if children is a string (markdown text) or React node (spinner)
  const isString = typeof children === "string";

  return (
    <div className={`flex ${from === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={
          from === "user"
            ? `${base} bg-emerald-600 text-white`
            : `${base} bg-white text-zinc-800`
        }
      >
        {isBot && isString ? (
          <ReactMarkdown>{children}</ReactMarkdown>
        ) : (
          children
        )}
      </div>
    </div>
  );
}


export default function TokBot({ regions = ["global"], initialOpen = true, hideOnMobile = true }) {
  const [open, setOpen] = useState(initialOpen);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: "bot", text: "👋 Welcome to TokBot. Ask me about risks or obligations." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const lastRegionsKey = useRef("");
  const messagesEndRef = useRef(null);

  const prettyRegions = useMemo(() => (regions || []).join(", "), [regions]);

  const scrollToBottomonOpen = () => {
    messagesEndRef.current?.scrollIntoView();
  };
  useEffect(() => {
    if (open) {
      scrollToBottomonOpen();
    }
  }, [open]);
  const scrollToBottomonMsg = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (open) {
      scrollToBottomonMsg();
    }
  }, [messages]);



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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/compliance-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", text: data.reply }]);
    } catch (err) {
      console.error("Error:", err);
      setMessages([...newMessages, { role: "assistant", text: "⚠️ Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  const visibility = hideOnMobile ? "hidden lg:block" : "";

  // Minimized button
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

  // Panel sizes
  const panelWidth = expanded ? "w-[500px]" : "w-[300px]";
  const panelHeight = expanded ? "h-[70vh]" : "h-[50vh]";

  return (
    <div className={`${visibility} fixed right-6 bottom-10 z-40 ${panelWidth} ${panelHeight}`}>
      <Card className="p-3 shadow-xl h-full flex flex-col">
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

          <div className="flex items-center gap-2">
            {/* Expand/Shrink button */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition"
              title={expanded ? "Shrink" : "Expand"}
              aria-label="Expand chat"
            >
              {expanded ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                </svg>
              )}
            </button>

            {/* Close button */}
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
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {messages.map((m, idx) => (
            <Bubble key={m.id || idx} from={m.role}>
              {m.text}
            </Bubble>
          ))}

          {loading && (
            <Bubble from="bot">
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-emerald-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                <span>Typing...</span>
              </div>
            </Bubble>
          )}

          <div ref={messagesEndRef} />
        </div>


        {/* Input */}
        <form onSubmit={sendMessage} className="mt-3 flex gap-2">
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