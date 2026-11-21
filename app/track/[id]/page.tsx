"use strict";
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PriorityBadge } from "@/components/PriorityBadge";
import type { Ticket } from "@/lib/schema";
import { formatTimeRemaining } from "@/lib/sla";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  ShieldCheck,
  Send,
  AlertTriangle,
  FileText,
  UserCheck,
} from "lucide-react";

export default function CitizenTrackPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tickets/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setTicket(data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mx-auto mb-3" />
        <p className="text-sm">Fetching real-time ticket status from Municipal Corporation...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Ticket Not Found</h3>
        <p className="text-sm text-slate-400">No civic complaint found with reference ID "{params.id}".</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Home
        </Link>
      </div>
    );
  }

  const sla = formatTimeRemaining(ticket.sla_deadline, ticket.status);

  // Timeline steps
  const steps = [
    { title: "Complaint Filed", desc: "Received via citizen portal with initial timestamp", done: true },
    { title: "AI Triage & Categorization", desc: `Classified as ${ticket.category} (${ticket.severity} Priority)`, done: true },
    { title: "Department Routing", desc: `Routed to ${ticket.department}`, done: true },
    {
      title: "Field Crew Dispatched",
      desc: ticket.assigned_to ? `Assigned to: ${ticket.assigned_to}` : "Queued for nearest zonal engineer",
      done: ticket.status === "in_progress" || ticket.status === "resolved",
    },
    { title: "Resolved & Closed", desc: "Issue inspected and verified on-site", done: ticket.status === "resolved" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6 animate-fade-in">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400">
        <ArrowLeft className="h-4 w-4" /> Back to Report Issue
      </Link>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-cyan-400">{ticket.id}</span>
              <PriorityBadge severity={ticket.severity} />
            </div>
            <p className="text-xs text-slate-400 mt-1">Submitted on {new Date(ticket.created_at).toLocaleString()}</p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                ticket.status === "resolved"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : ticket.status === "in_progress"
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              }`}
            >
              {ticket.status.replace("_", " ")}
            </span>
            <div className={`px-2.5 py-1 rounded-lg text-xs border ${sla.badgeColor}`}>{sla.displayText}</div>
          </div>
        </div>

        {/* Complaint Details */}
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-white">{ticket.summary}</h4>
          {(ticket.address_text || ticket.location_hint) && (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs text-cyan-300">
                <MapPin className="h-3.5 w-3.5" />
                <span>{ticket.address_text || ticket.location_hint}</span>
              </p>
              <p className="text-[10px] text-slate-500 italic">
                🔒 For citizen privacy, exact GPS coordinates are masked; verified ward street address displayed.
              </p>
            </div>
          )}
          <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-800 text-xs space-y-1">
            <span className="text-slate-500 font-semibold block">Action Plan:</span>
            <span className="text-slate-300">{ticket.suggested_action}</span>
          </div>
        </div>

        {/* Live Tracking Timeline */}
        <div className="space-y-4 pt-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Action Timeline</h5>
          <div className="space-y-4">
            {steps.map((st, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center shrink-0 mt-0.5">
                  {st.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <div className="h-3 w-3 rounded-full border-2 border-slate-600 bg-slate-900" />
                  )}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${st.done ? "text-slate-200" : "text-slate-500"}`}>
                    {st.title}
                  </p>
                  <p className="text-[11px] text-slate-400">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
