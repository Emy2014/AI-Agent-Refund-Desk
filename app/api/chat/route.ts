import { runTurn } from "@/lib/runner";
import { clearSessions, getOrCreateSession } from "@/lib/sessions";
import { resetMockData } from "@/lib/tools";

const MAX_MESSAGE_LENGTH = 500;

// One customer message in, one reply out. All agent work happens in runTurn.
export async function POST(request: Request) {
  let body: { sessionId?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }

  const session = getOrCreateSession(typeof body.sessionId === "string" ? body.sessionId : null);
  const reply = runTurn(session, message.slice(0, MAX_MESSAGE_LENGTH));

  return Response.json({
    sessionId: session.id,
    reply,
    trace: session.trace,
    // For display only. The server never reads state back from the browser.
    state: {
      role: session.role,
      charge: session.charge,
      verified: session.verified,
      attempts: session.attempts,
      ended: session.ended,
    },
  });
}

// Demo helper: wipes all mock data (sessions and recorded refunds) so the
// success conversation can be run again without restarting the server.
export async function DELETE() {
  clearSessions();
  resetMockData();
  return Response.json({ ok: true });
}
