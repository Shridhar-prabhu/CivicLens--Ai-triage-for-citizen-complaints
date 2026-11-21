"use strict";
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PriorityBadge } from "./PriorityBadge";
import type { Ticket } from "@/lib/schema";
import { formatTimeRemaining } from "@/lib/sla";
import {
  Clock,
  Building2,
  MapPin,
  Sparkles,
  AlertOctagon,
  Languages,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Copy,
  Check,
} from "lucide-react";

interface TicketCardProps {
  ticket: Ticket;
  compact?: boolean;
}

export function TicketCard({ ticket, compact = false }: TicketCardProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);

  const sla = formatTimeRemaining(ticket.sla_deadline, ticket.status);

  const copyTicketId = () => {
    navigator.clipboard.writeText(ticket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`glass-panel rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
        ticket.severity === "Critical" ? "glass-card-critical" : "glass-panel-hover"
      }`}
    >
      {/* Header bar: ID, Badges, SLA */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={copyTicketId}
            className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-300 hover:text-cyan-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors"
            title="Click to copy ID"
          >
            <span>{ticket.id}</span>
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-500" />}
          </button>

          <PriorityBadge severity={ticket.severity} />

          {/* AI vs Fallback Badge (Honest Tagging) */}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
              ticket.source === "ai"
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
          >
            {ticket.source === "ai" ? "AI Triage" : "Keyword Fallback"}
          </span>

          {ticket.image_changed_result && (
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
              <ImageIcon className="h-2.5 w-2.5" />
              Vision Hazard Detected
            </span>
          )}

          {ticket.needs_human_review && (
            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-400 border border-yellow-500/30">
              Needs Human Review
            </span>
          )}
        </div>

        {/* SLA Countdown Timer */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs border ${sla.badgeColor}`}>
            <Clock className="h-3.5 w-3.5" />
            <span>SLA: {sla.displayText}</span>
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-4 space-y-3.5">
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-white tracking-tight">{ticket.summary}</h4>
          {ticket.location_hint && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>{ticket.location_hint}</span>
            </p>
          )}
        </div>

        {/* Department and Category pill */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 px-3 py-1.5 text-slate-300 border border-slate-800">
            <Building2 className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400">Route:</span>
            <strong className="text-slate-200">{ticket.department}</strong>
          </span>

          <span className="rounded-lg bg-slate-900/70 px-2.5 py-1.5 text-slate-400 border border-slate-800">
            Category: <span className="text-slate-300 font-medium">{ticket.category}</span>
          </span>

          <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-indigo-300 border border-indigo-500/20 font-mono">
            Score: <strong className="text-white">{ticket.priority_score}</strong>/100
          </span>
        </div>

        {/* Severity Reason */}
        <div className="rounded-xl bg-slate-900/50 p-3 border border-slate-800/80">
          <div className="flex items-start gap-2 text-xs">
            <AlertOctagon className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Severity Assessment: </span>
              <span className="text-slate-400">{ticket.severity_reason}</span>
            </div>
          </div>
        </div>

        {/* Suggested Action */}
        <div className="rounded-xl bg-cyan-950/20 p-3 border border-cyan-800/30">
          <div className="flex items-start gap-2 text-xs">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-cyan-300">Suggested Action: </span>
              <span className="text-slate-300">{ticket.suggested_action}</span>
            </div>
          </div>
        </div>

        {/* Language & Translation accordion */}
        {ticket.detected_language && ticket.detected_language !== "English" && (
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800 text-xs">
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="flex w-full items-center justify-between text-slate-400 hover:text-slate-200"
            >
              <div className="flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  Detected: <strong className="text-slate-300">{ticket.detected_language}</strong> &bull; Translated to English
                </span>
              </div>
              {showOriginal ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showOriginal && (
              <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1.5 text-slate-300">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Original Raw Submission:</p>
                <p className="italic text-slate-400 bg-slate-900/80 p-2 rounded-lg font-sans">{ticket.raw_text}</p>
              </div>
            )}
          </div>
        )}

        {/* Urgency Signals pills */}
        {ticket.urgency_signals && ticket.urgency_signals.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">Signals:</span>
            {ticket.urgency_signals.map((signal, idx) => (
              <span
                key={idx}
                className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-300 border border-rose-500/20"
              >
                {signal}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer bar: Track & Action */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4 text-xs">
        <div className="text-slate-500">
          Confidence: <span className="font-semibold text-slate-300">{Math.round(ticket.confidence * 100)}%</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/track/${ticket.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 font-medium text-slate-200 transition-colors border border-slate-700/60"
          >
            <span>Citizen Tracking View</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
