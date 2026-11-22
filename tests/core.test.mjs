// The three small tests on the core flow (CLAUDE.md, "Tests").
// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { qualityGate } from "../lib/agent/gate.ts";
import { canSend, checkEmail, emailPasses } from "../lib/pitch-rules.ts";

const goodEmail = `Hi Dr. Sharma,

I'm Aarryan, a CS student in Nagpur. Your clinic's website takes about 9 seconds to open on a phone, and there's no WhatsApp button for booking.

I made a faster version so you can see the difference:
https://pitch-proof.vercel.app/p/sharma-clinic-ab12c

If it's useful, I'd be happy to finish it properly. Could we talk for 10 minutes this week? If not, just reply "no" and I won't write again.

Aarryan`;

test("quality gate rejects a site with no hard-evidence problem", () => {
  const soft = [{ problem: "Looks dated", evidence: "The colours feel old", hard: false }];
  assert.equal(qualityGate(soft, { checked: true }).passed, false);
  assert.equal(qualityGate([], { checked: true }).passed, false);
  assert.equal(qualityGate([{ problem: "Slow on phones", evidence: "Mobile speed score 23/100", hard: true }], { checked: false }).passed, false);
  assert.equal(qualityGate([{ problem: "Slow on phones", evidence: "Mobile speed score 23/100", hard: true }], { checked: true }).passed, true);
});

test("email draft passes the banned-phrase check and length limit", () => {
  assert.equal(emailPasses(goodEmail), true, JSON.stringify(checkEmail(goodEmail)));
  const banned = goodEmail.replace("I made a faster version", "I hope this email finds you well. I made a seamless version");
  assert.equal(emailPasses(banned), false);
  assert.equal(emailPasses("Hi, short one https://x.y reply no"), false);
});

test("a pitch can't be sent without approval", () => {
  assert.equal(canSend({ status: "draft", approved_at: null, email_body: goodEmail }), false);
  assert.equal(canSend({ status: "approved", approved_at: null, email_body: goodEmail }), false);
  assert.equal(canSend({ status: "approved", approved_at: "2026-11-22T10:00:00Z", email_body: "too short" }), false);
  assert.equal(canSend({ status: "approved", approved_at: "2026-11-22T10:00:00Z", email_body: goodEmail }), true);
});
