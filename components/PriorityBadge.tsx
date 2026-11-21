"use strict";
import React from "react";
import type { Severity } from "@/lib/schema";

interface PriorityBadgeProps {
  severity: Severity;
  showPulse?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PriorityBadge({ severity, showPulse = true, size = "md" }: PriorityBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  }[size];

  switch (severity) {
    case "Critical":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold border text-rose-300 bg-rose-500/15 border-rose-500/40 shadow-sm shadow-rose-900/30 ${
            showPulse ? "pulse-critical" : ""
          } ${sizeClasses}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
          Critical
        </span>
      );
    case "High":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium border text-orange-300 bg-orange-500/15 border-orange-500/40 ${sizeClasses}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
          High
        </span>
      );
    case "Medium":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium border text-amber-300 bg-amber-500/15 border-amber-500/40 ${sizeClasses}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Medium
        </span>
      );
    case "Low":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium border text-emerald-300 bg-emerald-500/15 border-emerald-500/40 ${sizeClasses}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Low
        </span>
      );
  }
}
