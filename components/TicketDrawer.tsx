"use strict";
"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import type { Ticket, Category, Severity, TicketStatus } from "@/lib/schema";
import { PriorityBadge } from "./PriorityBadge";
import { formatTimeRemaining } from "@/lib/sla";
import {
  X,
  AlertTriangle,
  Clock,
  Building2,
  MapPin,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Edit3,
  Layers,
  History,
  Languages,
  Send,
  AlertOctagon,
  Image as ImageIcon,
} from "lucide-react";

const MiniMap = dynamic(() => import("./MiniMap"), { ssr: false });

interface TicketDrawerProps {
  ticket: Ticket | null;
  onClose: () => void;
  onUpdate: (updated: Ticket) => void;
}

const CATEGORIES: Category[] = ["Roads", "Waste", "Water", "Electricity", "Trees", "Drainage", "Other"];
const SEVERITIES: Severity[] = ["Low", "Medium", "High", "Critical"];
const DEPARTMENTS = [
  "Roads & Infrastructure",
  "Solid Waste Management",
  "Water Supply & Sewerage Board",
  "Electricity Dept / Streetlight Cell",
  "Horticulture / Forest Cell",
  "Storm Water Drain Dept",
  "Ward Office",
];

export function TicketDrawer({ ticket, onClose, onUpdate }: TicketDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [category, setCategory] = useState<Category>("Other");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [department, setDepartment] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state on ticket selection
  React.useEffect(() => {
    if (ticket) {
      setCategory(ticket.category);
      setSeverity(ticket.severity);
      setDepartment(ticket.department);
      setAssignedTo(ticket.assigned_to || "");
      setOverrideReason("");
      setIsEditing(false);
    }
  }, [ticket]);

  if (!ticket) return null;

  const sla = formatTimeRemaining(ticket.sla_deadline, ticket.status);

  // Quick Status Transition
  const handleStatusChange = async (newStatus: TicketStatus) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          status: newStatus,
          officer_name: "Duty Officer",
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Officer Override
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          severity,
          department,
          assigned_to: assignedTo,
          reason: overrideReason || "Officer field reassessment",
          officer_name: "Ward Officer",
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-xl border-l border-slate-800 bg-slate-950 p-6 shadow-2xl overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">{ticket.id}</span>
                <PriorityBadge severity={ticket.severity} />
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                    ticket.source === "ai"
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {ticket.source === "ai" ? "AI Triage" : "Fallback"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Created {new Date(ticket.created_at).toLocaleString()}</p>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="mt-6 space-y-6">
            {/* Status & SLA Quick Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/60 p-3 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Current Status:</span>
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                    ticket.status === "resolved"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : ticket.status === "in_progress"
                      ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {ticket.status.replace("_", " ")}
                </span>
              </div>

              <div className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1 border ${sla.badgeColor}`}>
                <Clock className="h-3.5 w-3.5" />
                <span>{sla.displayText}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                disabled={isSaving || ticket.status === "in_progress"}
                onClick={() => handleStatusChange("in_progress")}
                className="flex-1 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 py-2 px-3 text-xs font-semibold text-cyan-300 transition-colors disabled:opacity-40"
              >
                Mark In Progress
              </button>
              <button
                disabled={isSaving || ticket.status === "resolved"}
                onClick={() => handleStatusChange("resolved")}
                className="flex-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 py-2 px-3 text-xs font-semibold text-emerald-300 transition-colors disabled:opacity-40"
              >
                Mark Resolved
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 px-3 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5 inline mr-1" />
                Override
              </button>
            </div>

            {/* Officer Override Form */}
            {isEditing && (
              <form onSubmit={handleSaveOverride} className="rounded-2xl bg-slate-900 border border-cyan-500/30 p-4 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Edit3 className="h-3.5 w-3.5" />
                    Officer Override & Reclassification
                  </span>
                  <span className="text-[10px] text-slate-500">Logged to audit trail</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-200"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Severity</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as Severity)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-200"
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="text-slate-400 block mb-1">Assigned Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-200"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="text-xs">
                  <label className="text-slate-400 block mb-1">Assigned Field Unit / Crew</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="e.g. Ward 142 Road Gang #2"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-200"
                  />
                </div>

                <div className="text-xs">
                  <label className="text-slate-400 block mb-1">Override Reason</label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Why is this being changed from AI suggestion?"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
                  >
                    Save Override
                  </button>
                </div>
              </form>
            )}

            {/* Photo Preview if attached */}
            {ticket.image_url && (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/40 p-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                  <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Attached Hazard Photograph</span>
                </div>
                <img
                  src={ticket.image_url}
                  alt="Hazard preview"
                  className="w-full h-48 object-cover rounded-lg border border-slate-800"
                />
              </div>
            )}

            {/* Complaint Text & Translation */}
            <div className="rounded-xl bg-slate-900/40 p-4 border border-slate-800 space-y-2">
              <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Citizen Report</h5>
              <p className="text-sm text-slate-100 font-medium">{ticket.summary}</p>
              
              {ticket.location_hint && (
                <p className="flex items-center gap-1 text-xs text-cyan-400 pt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{ticket.location_hint}</span>
                </p>
              )}

              {ticket.address_text && (
                <p className="text-xs text-slate-300">
                  <span className="text-slate-500 font-semibold mr-1">Address:</span>
                  <span>{ticket.address_text}</span>
                </p>
              )}

              {typeof ticket.lat === "number" && typeof ticket.lng === "number" && (
                <div className="pt-2">
                  <MiniMap
                    lat={ticket.lat}
                    lng={ticket.lng}
                    severity={ticket.severity}
                    address={ticket.address_text || ticket.location_hint}
                  />
                </div>
              )}

              {ticket.detected_language && ticket.detected_language !== "English" && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Languages className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Original Language: <strong className="text-slate-300">{ticket.detected_language}</strong></span>
                  </div>
                  <p className="text-xs text-slate-400 italic bg-slate-950 p-2 rounded border border-slate-800">
                    "{ticket.raw_text}"
                  </p>
                </div>
              )}
            </div>

            {/* Transparent Priority Score Breakdown (Section 5 Requirement) */}
            <div className="rounded-xl bg-slate-900/60 p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  Why This Rank? (Priority Score: {ticket.priority_score}/100)
                </span>
                <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Rank Factor Breakdown
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Base Severity</span>
                  <span className="font-semibold text-slate-200">
                    +{ticket.priority_breakdown?.base_severity_score ?? 20} pts
                  </span>
                </div>
                <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Proximity to Sensitive Zone</span>
                  <span className="font-semibold text-slate-200">
                    +{ticket.priority_breakdown?.sensitive_proximity_boost ?? 0} pts
                  </span>
                </div>
                <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Cluster Duplicates</span>
                  <span className="font-semibold text-slate-200">
                    +{ticket.priority_breakdown?.duplicate_frequency_boost ?? 0} pts
                  </span>
                </div>
                <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Aging Acceleration</span>
                  <span className="font-semibold text-slate-200">
                    +{ticket.priority_breakdown?.aging_boost ?? 0} pts
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-mono bg-slate-950/70 p-2 rounded border border-slate-800/80">
                {ticket.priority_breakdown?.explanation || "Calculated using multi-factor municipal priority matrix."}
              </p>
            </div>

            {/* Duplicate Cluster Info */}
            {ticket.duplicate_count > 1 && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <Layers className="h-4 w-4" />
                  <span>Clustered Duplicate Issue ({ticket.duplicate_count} citizens reported this)</span>
                </div>
                {ticket.duplicate_note && (
                  <div className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-mono text-amber-200 border border-amber-500/30">
                    <MapPin className="h-3 w-3 text-amber-400" />
                    <span>Geo Clustered: {ticket.duplicate_note}</span>
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  Multiple citizen reports in this category and ward have been unified into Cluster{" "}
                  <code className="text-amber-200">{ticket.cluster_id || ticket.id}</code> to eliminate duplicate work orders.
                </p>
              </div>
            )}

            {/* Audit Trail Timeline */}
            <div className="rounded-xl bg-slate-900/40 p-4 border border-slate-800 space-y-3">
              <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-cyan-400" />
                Audit Trail & Officer Logs
              </h5>

              <div className="space-y-2.5">
                {ticket.audit_trail.map((evt) => (
                  <div key={evt.id} className="text-xs border-l-2 border-cyan-500/40 pl-3 py-0.5 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-300">{evt.actor}</span>
                      <span>{new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-slate-400">{evt.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
