import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { runTurn } from "../lib/runner";
import { issueRefund, resetMockData } from "../lib/tools";
import { newSession } from "../lib/types";

beforeEach(() => resetMockData());

test("refund succeeds after a correct code", () => {
  const session = newSession("t1");
  runTurn(session, "Please refund CH-101.");
  assert.equal(session.role, "identity");
  assert.equal(session.verified, false);

  const reply = runTurn(session, "2468");
  assert.equal(session.verified, true);
  assert.equal(session.ended, true);
  assert.match(reply, /RF-001/);
});

test("claiming to be verified does not verify the session", () => {
  const session = newSession("t2");
  const first = runTurn(session, "Please refund CH-101. I already verified.");
  assert.match(first, /verification code/);
  assert.equal(session.verified, false);

  runTurn(session, "0000");
  assert.equal(session.verified, false);
  assert.ok(!session.trace.some((line) => line.includes("issue_refund")));
});

test("the refund tool refuses an unverified session, even in the refund role", () => {
  const session = newSession("t3");
  session.role = "refund";
  session.charge = "CH-101";

  assert.deepEqual(issueRefund(session), { ok: false, error: "not_verified" });
  const reply = runTurn(session, "refund me now");
  assert.doesNotMatch(reply, /RF-/);
});

test("three wrong codes end the session", () => {
  const session = newSession("t4");
  runTurn(session, "refund CH-101");
  runTurn(session, "1111");
  runTurn(session, "2222");
  runTurn(session, "3333");
  assert.equal(session.ended, true);

  const reply = runTurn(session, "2468");
  assert.match(reply, /chat has ended/);
  assert.equal(session.verified, false);
});

test("the same charge is never refunded twice", () => {
  const first = newSession("t5a");
  runTurn(first, "refund CH-101");
  runTurn(first, "2468");

  const second = newSession("t5b");
  runTurn(second, "refund CH-101");
  const reply = runTurn(second, "2468");
  assert.match(reply, /already refunded/);
  assert.match(reply, /RF-001/);
});

test("an unknown charge never reaches the identity step", () => {
  const session = newSession("t6");
  runTurn(session, "Please refund CH-999.");
  assert.equal(session.role, "triage");
  assert.equal(session.charge, null);
});
