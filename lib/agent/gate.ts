// The quality gate (docs/06-blueprint.md section 5): a company gets a pitch
// only if at least one problem has hard evidence, meaning a number or a clear
// yes/no fact from a tool. Opinions alone never pass.
// No imports, so the tests can run this file directly.

type GateFinding = { problem: string; evidence: string; hard: boolean };

export type GateResult = { passed: true } | { passed: false; reason: string };

export function qualityGate(findings: GateFinding[], opts: { checked: boolean }): GateResult {
  if (!opts.checked) return { passed: false, reason: "Couldn't check the website yet, so no pitch." };
  const hard = findings.filter((f) => f.hard && f.evidence.trim().length > 0);
  if (hard.length > 0) return { passed: true };
  if (findings.length > 0) return { passed: false, reason: "Only soft opinions, no measurable problem." };
  return { passed: false, reason: "The website looks fine for this skill. No real problem to pitch." };
}
