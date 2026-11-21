import type { PriorityBreakdown, Severity } from "./schema";

/**
 * Transparent Priority Score (0 - 100)
 * 
 * Hackathon Innovation Layer (Section 5):
 * Computed transparently so municipal officers can inspect "Why this rank"
 * directly in the ticket drawer.
 * 
 * Components:
 * 1. Base Severity (Critical=50, High=35, Medium=20, Low=10)
 * 2. Sensitive Proximity Boost (+20 if near school, hospital, children, elderly)
 * 3. Duplicate Frequency Boost (+5 per report, max +20 for high-volume clusters)
 * 4. Aging Boost (+2 per 6 hours open, max +10 to prevent ticket stagnation)
 */

const SEVERITY_BASE_SCORES: Record<Severity, number> = {
  Critical: 50,
  High: 35,
  Medium: 20,
  Low: 10,
};

export function calculatePriorityScore(params: {
  severity: Severity;
  urgency_signals?: string[];
  duplicate_count?: number;
  created_at?: string;
  is_near_sensitive?: boolean;
}): { score: number; breakdown: PriorityBreakdown } {
  const {
    severity,
    urgency_signals = [],
    duplicate_count = 1,
    created_at = new Date().toISOString(),
    is_near_sensitive = false,
  } = params;

  // 1. Base Severity
  const base_severity_score = SEVERITY_BASE_SCORES[severity] ?? 10;

  // 2. Sensitive Proximity Boost
  const sensitiveWords = ["school", "hospital", "children", "kids", "elderly", "market", "temple", "अस्पताल", "स्कूल", "ಶಾಲೆ", "ಆಸ್ಪತ್ರೆ"];
  const hasSensitiveSignal =
    is_near_sensitive ||
    urgency_signals.some((s) => sensitiveWords.some((sw) => s.toLowerCase().includes(sw)));
  const sensitive_proximity_boost = hasSensitiveSignal ? 20 : 0;

  // 3. Duplicate Frequency Boost (+5 per additional report, up to +20)
  const additionalReports = Math.max(0, duplicate_count - 1);
  const duplicate_frequency_boost = Math.min(20, additionalReports * 5);

  // 4. Aging Boost (older unaddressed tickets rise gradually)
  const ageHours = Math.max(0, (Date.now() - new Date(created_at).getTime()) / (1000 * 60 * 60));
  const aging_boost = Math.min(10, Math.floor(ageHours / 6) * 2);

  const total_score = Math.min(
    100,
    base_severity_score + sensitive_proximity_boost + duplicate_frequency_boost + aging_boost
  );

  const reasons: string[] = [
    `Base severity (${severity}): ${base_severity_score} pts`,
  ];
  if (sensitive_proximity_boost > 0) {
    reasons.push("Sensitive location proximity: +20 pts");
  }
  if (duplicate_frequency_boost > 0) {
    reasons.push(`Duplicate cluster reports (${duplicate_count} citizens): +${duplicate_frequency_boost} pts`);
  } else {
    reasons.push(`Duplicate frequency: 1 report (0 pts)`);
  }
  if (aging_boost > 0) {
    reasons.push(`Awaiting triage for ${Math.round(ageHours)}h: +${aging_boost} pts`);
  }

  return {
    score: total_score,
    breakdown: {
      base_severity_score,
      sensitive_proximity_boost,
      duplicate_frequency_boost,
      aging_boost,
      total_score,
      explanation: reasons.join(" • "),
    },
  };
}
