import type { Session, ToolResult } from "./types";

export const CHARGES: Record<string, { id: string; amount: number }> = {
  "CH-101": { id: "CH-101", amount: 25 },
};

const VALID_CODE = "2468";
export const MAX_ATTEMPTS = 3;

type Refund = { reference: string; chargeId: string; amount: number };

// Module-level, so it outlives any one session: New chat cannot refund CH-101 twice.
const refundsByCharge = new Map<string, Refund>();

// The only place in the codebase that sets session.verified = true.
export function verifyIdentity(session: Session, code: string): ToolResult {
  session.attempts += 1;
  if (code !== VALID_CODE) return { ok: false, error: "wrong_code" };
  session.verified = true;
  return { ok: true };
}

// The refund rule is enforced here, at the action, not in the agents.
export function issueRefund(session: Session): ToolResult {
  if (!session.verified) return { ok: false, error: "not_verified" };

  const charge = CHARGES[session.charge ?? ""];
  if (!charge) return { ok: false, error: "unknown_charge" };

  const existing = refundsByCharge.get(charge.id);
  if (existing) return { ok: true, reference: existing.reference, duplicate: true };

  const refund: Refund = {
    reference: `RF-${String(refundsByCharge.size + 1).padStart(3, "0")}`,
    chargeId: charge.id,
    amount: charge.amount,
  };
  refundsByCharge.set(charge.id, refund);
  return { ok: true, reference: refund.reference, duplicate: false };
}

// For tests and the demo script only.
export function resetMockData(): void {
  refundsByCharge.clear();
}
