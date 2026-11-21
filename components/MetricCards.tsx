"use strict";
import React from "react";
import { AlertOctagon, Flame, Clock, CheckCircle2, TrendingUp, ShieldAlert, Cpu } from "lucide-react";

interface MetricCardsProps {
  stats: {
    total: number;
    critical: number;
    high: number;
    open: number;
    overdue: number;
    avgTriageTimeSeconds: number;
    agreementRate: number;
  };
}

export function MetricCards({ stats }: MetricCardsProps) {
  const cards = [
    {
      label: "Total Tickets",
      value: stats.total,
      subtext: "Logged across city",
      icon: ShieldAlert,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      label: "Critical Emergencies",
      value: stats.critical,
      subtext: "Immediate life hazard",
      icon: Flame,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/30",
      pulse: stats.critical > 0,
    },
    {
      label: "High Priority",
      value: stats.high,
      subtext: "Major hazard / 24h SLA",
      icon: AlertOctagon,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
    },
    {
      label: "Open / Active",
      value: stats.open,
      subtext: "Awaiting resolution",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "SLA Overdue",
      value: stats.overdue,
      subtext: stats.overdue > 0 ? "Requires escalation" : "All within SLA",
      icon: AlertOctagon,
      color: stats.overdue > 0 ? "text-rose-400" : "text-emerald-400",
      bg: stats.overdue > 0 ? "bg-rose-950/40 border-rose-500/40" : "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Avg Triage Time",
      value: `${stats.avgTriageTimeSeconds}s`,
      subtext: "End-to-end AI latency",
      icon: Cpu,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "AI vs Officer Agreement",
      value: `${stats.agreementRate}%`,
      subtext: "Triage classification accuracy",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-2xl p-4 border backdrop-blur-md transition-all hover:translate-y-[-2px] ${card.bg}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 truncate">{card.label}</span>
              <Icon className={`h-4 w-4 ${card.color} ${card.pulse ? "animate-pulse" : ""}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tracking-tight text-white`}>{card.value}</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500 truncate">{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
