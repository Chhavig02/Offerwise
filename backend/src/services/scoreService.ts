import { Flag } from '@/types';

const SEVERITY_PENALTY: Partial<Record<Flag['severity'], number>> = {
  critical: 25,
  high: 15,
  medium: 5,
};
const DEFAULT_PENALTY = 2;

function getPenalty(severity: Flag['severity']): number {
  return SEVERITY_PENALTY[severity] ?? DEFAULT_PENALTY;
}

export function calculateScore(riskFlags: Flag[]): number {
  const baseScore = 100;
  const penalty = riskFlags.reduce((acc, flag) => acc + getPenalty(flag.severity), 0);
  return Math.max(0, baseScore - penalty);
}

// Decorates each risk flag with how many points it cost, so the report can
// show "why" the score is what it is instead of just the final number.
export function withScoreImpact(riskFlags: Flag[]): Flag[] {
  return riskFlags.map(flag => ({ ...flag, scoreImpact: getPenalty(flag.severity) }));
}
