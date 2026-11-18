"use client";

import { useEffect, useRef, useState } from "react";

type Message = { from: "customer" | "agent"; text: string };

type SessionView = {
  role: string;
  charge: string | null;
  verified: boolean;
  attempts: number;
  ended: boolean;
};

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [trace, setTrace] = useState<string[]>([]);
  const [view, setView] = useState<SessionView | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;

    setDraft("");
    setError(null);
    setPending(true);
    setMessages((current) => [...current, { from: "customer", text }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Request failed.");

      setSessionId(data.sessionId);
      setTrace(data.trace);
      setView(data.state);
      setMessages((current) => [...current, { from: "agent", text: data.reply }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  // New chat: forget the session ID. The next message gets a fresh, unverified session.
  function newChat() {
    setSessionId(null);
    setMessages([]);
    setTrace([]);
    setView(null);
    setDraft("");
    setError(null);
  }

  async function resetDemoData() {
    await fetch("/api/chat", { method: "DELETE" });
    newChat();
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>FinchPay refund desk</h1>
          <p>Try "Please refund CH-101." The verification code is 2468.</p>
        </div>
        <div className="actions">
          <button type="button" className="ghost" onClick={resetDemoData} disabled={pending}>
            Reset demo data
          </button>
          <button type="button" onClick={newChat} disabled={pending}>
            New chat
          </button>
        </div>
      </header>

      <div className="columns">
        <section className="panel" aria-label="Conversation">
          <h2>Conversation</h2>
          <div className="transcript" data-testid="transcript">
            {messages.length === 0 && <p className="empty">No messages yet.</p>}
            {messages.map((message, index) => (
              <div key={index} className={`bubble ${message.from}`}>
                <span className="who">{message.from === "customer" ? "You" : "FinchPay"}</span>
                {message.text}
              </div>
            ))}
            <div ref={transcriptEnd} />
          </div>

          {error && <p className="error">{error}</p>}

          <form className="composer" onSubmit={send}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message"
              aria-label="Message"
              maxLength={500}
              autoFocus
            />
            <button type="submit" disabled={pending || !draft.trim()}>
              {pending ? "Sending" : "Send"}
            </button>
          </form>
        </section>

        <section className="panel" aria-label="Trace">
          <h2>Trace</h2>
          <dl className="state" data-testid="state">
            <div><dt>Role</dt><dd>{view?.role ?? "triage"}</dd></div>
            <div><dt>Charge</dt><dd>{view?.charge ?? "none"}</dd></div>
            <div><dt>Verified</dt><dd>{String(view?.verified ?? false)}</dd></div>
            <div><dt>Status</dt><dd>{view?.ended ? "ended" : "open"}</dd></div>
          </dl>
          <pre className="trace" data-testid="trace">
            {trace.length ? trace.join("\n") : "The trace appears here after the first message."}
          </pre>
        </section>
      </div>
    </main>
  );
}
