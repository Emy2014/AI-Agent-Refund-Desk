import type { Agent, Role } from "./types";
import { CHARGES, MAX_ATTEMPTS } from "./tools";

const triage: Agent = (_session, input) => {
  const id = input?.match(/CH-\d+/i)?.[0].toUpperCase();
  if (!id) {
    return { type: "ask", message: "Which charge would you like refunded? For example, CH-101." };
  }
  if (!CHARGES[id]) {
    return { type: "ask", message: `I can't find charge ${id}. Please check the charge ID.` };
  }
  return { type: "handoff", to: "identity", charge: id };
};

const identity: Agent = (session, input, result) => {
  // Just back from verify_identity: act on what the tool said.
  if (result) {
    if (result.ok) return { type: "handoff", to: "refund" };
    if (session.attempts >= MAX_ATTEMPTS) {
      return { type: "final", message: "Verification failed too many times. No refund was issued." };
    }
    return { type: "ask", message: "That code didn't match, so I can't verify you yet. Please try again." };
  }

  // Anything that is not a 4-digit code (including "I already verified") gets the same question.
  const code = input?.match(/\b\d{4}\b/)?.[0];
  if (!code) {
    return { type: "ask", message: "To continue, please enter your 4-digit verification code." };
  }
  return { type: "tool", name: "verify_identity", code };
};

const refund: Agent = (session, _input, result) => {
  if (!result) return { type: "tool", name: "issue_refund" };
  if (result.ok) {
    return {
      type: "final",
      message: result.duplicate
        ? `${session.charge} was already refunded. Reference: ${result.reference}.`
        : `Your refund for ${session.charge} has been issued. Reference: ${result.reference}.`,
    };
  }
  return { type: "final", message: "I couldn't issue the refund. No money was moved." };
};

export const AGENTS: Record<Role, Agent> = { triage, identity, refund };
