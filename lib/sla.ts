import type { Severity } from "./schema";

/**
 * CivicLens SLA Timers & Deadlines
 * 
 * Requirements (Section 5):
 * - Critical: 2 hours (Emergency Life Hazard)
 * - High: 24 hours (Major Disturbance / Safety Risk)
 * - Medium: 72 hours (Timely Civic Repair)
 * - Low: 7 days (168 hours - Cosmetic / Minor)
 */

export const SLA_HOURS_MAP: Record<Severity, number> = {
  Critical: 2,
  High: 24,
  Medium: 72,
  Low: 168,
};

export function calculateSLADeadline(severity: Severity, createdAt: string = new Date().toISOString()): {
  slaHours: number;
  deadlineIso: string;
} {
  const slaHours = SLA_HOURS_MAP[severity] ?? 72;
  const createdDate = new Date(createdAt);
  const deadlineDate = new Date(createdDate.getTime() + slaHours * 60 * 60 * 1000);

  return {
    slaHours,
    deadlineIso: deadlineDate.toISOString(),
  };
}

export function checkIsOverdue(deadlineIso: string, status: string): boolean {
  if (status === "resolved") return false;
  return new Date(deadlineIso).getTime() < Date.now();
}

export function formatTimeRemaining(deadlineIso: string, status: string): {
  isOverdue: boolean;
  displayText: string;
  badgeColor: string;
} {
  if (status === "resolved") {
    return { isOverdue: false, displayText: "Resolved", badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
  }

  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  const isOverdue = diffMs < 0;
  const absDiffMs = Math.abs(diffMs);

  const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
  const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (isOverdue) {
    return {
      isOverdue: true,
      displayText: `Overdue by ${hours}h ${minutes}m`,
      badgeColor: "text-rose-400 bg-rose-500/20 border-rose-500/30 animate-pulse font-semibold",
    };
  }

  if (hours < 2) {
    return {
      isOverdue: false,
      displayText: `${hours}h ${minutes}m left`,
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20 font-medium",
    };
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  const text = days > 0 ? `${days}d ${remainingHours}h left` : `${hours}h left`;
  return {
    isOverdue: false,
    displayText: text,
    badgeColor: "text-slate-300 bg-slate-800/60 border-slate-700/50",
  };
}
