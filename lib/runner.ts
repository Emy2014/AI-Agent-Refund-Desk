import type { Decision, Session, ToolResult } from "./types";
import { AGENTS } from "./agents";
import { issueRefund, verifyIdentity } from "./tools";

const MAX_STEPS = 8;
const name = (role: string) => role[0].toUpperCase() + role.slice(1);

function log(session: Session, line: string): void {
  session.trace.push(line);
}

function runTool(session: Session, decision: Extract<Decision, { type: "tool" }>): ToolResult {
  const wasVerified = session.verified;
  const result =
    decision.name === "verify_identity"
      ? verifyIdentity(session, decision.code)
      : issueRefund(session);

  const detail = result.ok
    ? ["success", result.reference && `reference ${result.reference}`, result.duplicate && "duplicate"]
        .filter(Boolean)
        .join(", ")
    : `failure, ${result.error}`;
  log(session, `${name(session.role)} calls ${decision.name} | ${detail}`);
  if (!wasVerified && session.verified) log(session, "session.verified = true");
  return result;
}

// Runs one customer turn: loops until an agent asks the customer something or finishes.
export function runTurn(session: Session, message: string): string {
  if (session.ended) return "This chat has ended. Start a new chat to continue.";

  log(session, `Customer: ${message}`);
  let input: string | null = message;
  let result: ToolResult | null = null;

  for (let step = 0; step < MAX_STEPS; step++) {
    const decision = AGENTS[session.role](session, input, result);

    switch (decision.type) {
      case "tool":
        result = runTool(session, decision); // same agent runs again and sees the result
        input = null;
        break;

      case "handoff":
        if (decision.charge) session.charge = decision.charge;
        log(
          session,
          `${name(session.role)} → ${name(decision.to)}` +
            (decision.charge ? ` | requested charge ${decision.charge}` : "")
        );
        session.role = decision.to;
        input = null; // the next agent starts clean
        result = null;
        break;

      case "ask":
        log(session, `${name(session.role)} asks: "${decision.message}" | waiting for customer`);
        return decision.message;

      case "final":
        session.ended = true;
        log(session, `${name(session.role)} replies: "${decision.message}" | session ended`);
        return decision.message;
    }
  }

  session.ended = true;
  log(session, `Step limit (${MAX_STEPS}) reached | session ended`);
  return "Sorry, I couldn't complete that request. Please start a new chat.";
}
