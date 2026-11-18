export type Role = "triage" | "identity" | "refund";

export type Session = {
  id: string;
  role: Role;
  charge: string | null;
  verified: boolean;
  attempts: number;
  ended: boolean;
  trace: string[];
};

export type ToolResult = {
  ok: boolean;
  reference?: string;
  duplicate?: boolean;
  error?: string;
};

// The four things an agent can decide. The runner is the only code that acts on them.
export type Decision =
  | { type: "tool"; name: "verify_identity"; code: string }
  | { type: "tool"; name: "issue_refund" }
  | { type: "handoff"; to: Role; charge?: string }
  | { type: "ask"; message: string }
  | { type: "final"; message: string };

// An agent reads the session and returns one decision. It never writes to the session.
//   input  = the customer's message, if this agent is the first to see it this turn
//   result = the result of the tool this agent just called, if any
export type Agent = (
  session: Readonly<Session>,
  input: string | null,
  result: ToolResult | null
) => Decision;

export function newSession(id: string): Session {
  return {
    id,
    role: "triage",
    charge: null,
    verified: false,
    attempts: 0,
    ended: false,
    trace: [],
  };
}
