"use strict";
"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { MetricCards } from "@/components/MetricCards";
import { ChartsSection } from "@/components/ChartsSection";
import { TicketDrawer } from "@/components/TicketDrawer";
import { PriorityBadge } from "@/components/PriorityBadge";
import type { Ticket, Category, Severity, TicketStatus } from "@/lib/schema";
import { formatTimeRemaining } from "@/lib/sla";
import {
  Search,
  Filter,
  RefreshCw,
  Building2,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ArrowUpDown,
  MapPin,
  Map as MapIcon,
} from "lucide-react";
import Link from "next/link";

const DashboardMapView = dynamic(() => import("@/components/DashboardMapView"), { ssr: false });

const CATEGORIES = ["All", "Roads", "Waste", "Water", "Electricity", "Trees", "Drainage", "Other"];
const SEVERITIES = ["All", "Critical", "High", "Medium", "Low"];
const STATUSES = ["All", "open", "in_progress", "resolved"];

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [viewMode, setViewMode] = useState<"all" | "grouped" | "map">("all");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        fetch("/api/tickets"),
        fetch("/api/stats"),
      ]);

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data.tickets || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update ticket in state after drawer action (e.g. override or status transition)
  const handleTicketUpdate = (updated: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setActiveTicket(updated);
    // Refresh stats dynamically
    fetch("/api/stats").then((r) => {
      if (r.ok) {
        r.json().then(setStats);
      }
    });
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedCategory !== "All" && t.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (selectedSeverity !== "All" && t.severity.toLowerCase() !== selectedSeverity.toLowerCase()) {
        return false;
      }
      if (selectedStatus !== "All" && t.status.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          t.id.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.raw_text.toLowerCase().includes(q) ||
          t.location_hint.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, selectedCategory, selectedSeverity, selectedStatus, search]);

  // Grouped by duplicate clusters
  const clusteredGroups = useMemo(() => {
    const groups: Record<string, Ticket[]> = {};
    filteredTickets.forEach((t) => {
      const key = t.cluster_id || t.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.values(groups);
  }, [filteredTickets]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Municipal Command & Control
            </h2>
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30">
              Live Triage Feed
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time automated ticket sorting by priority (Critical &gt; High &gt; Medium &gt; Low) and SLA compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all"
          >
            <span>+ Submit Complaint</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Counters */}
      {stats && <MetricCards stats={stats} />}

      {/* Recharts Analytics Charts */}
      {stats && (
        <ChartsSection
          categoryData={stats.categoryData || []}
          severityData={stats.severityData || []}
        />
      )}

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket ID, keyword, landmark, or department..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* View Mode Toggle: All vs Clustered Duplicates vs Map View */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode("all")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                viewMode === "all" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Tickets ({filteredTickets.length})
            </button>
            <button
              onClick={() => setViewMode("grouped")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                viewMode === "grouped" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Cluster Groups ({clusteredGroups.length})
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === "map" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span>Map View</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium mr-2">
            <Filter className="h-3.5 w-3.5 text-cyan-400" />
            <span>Filters:</span>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-slate-300"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-slate-300"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-slate-300"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>{st === "All" ? "All" : st.replace("_", " ").toUpperCase()}</option>
              ))}
            </select>
          </div>

          {(selectedCategory !== "All" || selectedSeverity !== "All" || selectedStatus !== "All" || search) && (
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedSeverity("All");
                setSelectedStatus("All");
                setSearch("");
              }}
              className="text-cyan-400 hover:underline ml-auto text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Ticket List View (Priority Sorted: Critical > High > Medium > Low) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span>Showing {filteredTickets.length} prioritized tickets</span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-cyan-400">
            <ArrowUpDown className="h-3 w-3" />
            Sorted by Severity Rank &amp; Priority Score
          </span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
            <ShieldAlert className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">No tickets match the selected filters</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting filters or submitting a new citizen complaint.</p>
          </div>
        ) : viewMode === "map" ? (
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                Bengaluru Municipal Map View &bull; Pins colored by severity &bull; Duplicate clusters badged
              </span>
              <span className="font-mono text-[11px] text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {filteredTickets.filter((t) => typeof t.lat === "number").length} Geo-tagged Tickets
              </span>
            </div>
            <DashboardMapView
              tickets={filteredTickets}
              onSelectTicket={(ticket) => setActiveTicket(ticket)}
            />
          </div>
        ) : viewMode === "all" ? (
          <div className="space-y-2.5">
            {filteredTickets.map((ticket) => {
              const sla = formatTimeRemaining(ticket.sla_deadline, ticket.status);
              return (
                <div
                  key={ticket.id}
                  onClick={() => setActiveTicket(ticket)}
                  className={`glass-panel rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    ticket.severity === "Critical" ? "glass-card-critical" : "glass-panel-hover"
                  }`}
                >
                  {/* Left: ID, Severity, Category, Summary */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {ticket.id}
                      </span>
                      <PriorityBadge severity={ticket.severity} />
                      <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] text-slate-400 border border-slate-800">
                        {ticket.category}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          ticket.source === "ai"
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {ticket.source === "ai" ? "AI" : "Fallback"}
                      </span>
                      {ticket.duplicate_count > 1 && (
                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {ticket.duplicate_count} reports
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-white truncate">{ticket.summary}</h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{ticket.department}</span>
                      </span>
                      {ticket.address_text ? (
                        <span className="truncate max-w-xs text-slate-400">
                          &bull; {ticket.address_text}
                        </span>
                      ) : ticket.location_hint ? (
                        <span className="truncate max-w-xs text-slate-400">
                          &bull; {ticket.location_hint}
                        </span>
                      ) : null}

                      {typeof ticket.lat === "number" && typeof ticket.lng === "number" && (
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${ticket.lat}&mlon=${ticket.lng}#map=16/${ticket.lat}/${ticket.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                        >
                          <MapPin className="h-3 w-3" />
                          <span>Open in Map</span>
                        </a>
                      )}

                      {ticket.duplicate_note && (
                        <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                          {ticket.duplicate_note}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Score, SLA Timer, Status, Arrow */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-mono">
                        Score
                      </span>
                      <span className="text-sm font-bold text-white font-mono">{ticket.priority_score}/100</span>
                    </div>

                    <div className={`px-2.5 py-1 rounded-lg text-xs border ${sla.badgeColor}`}>
                      {sla.displayText}
                    </div>

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

                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Clustered Group View */
          <div className="space-y-4">
            {clusteredGroups.map((group, idx) => {
              const leadTicket = group[0];
              return (
                <div key={idx} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-amber-400" />
                      <h4 className="text-sm font-bold text-white">
                        Cluster #{leadTicket.cluster_id || leadTicket.id} &bull; {leadTicket.category}
                      </h4>
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
                        {group.length} Unified Reports
                      </span>
                    </div>
                    <PriorityBadge severity={leadTicket.severity} />
                  </div>

                  <p className="text-xs text-slate-300">
                    <strong>Primary Issue:</strong> {leadTicket.summary} ({leadTicket.department})
                  </p>

                  <div className="space-y-1.5 pt-1">
                    {group.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveTicket(item)}
                        className="flex items-center justify-between rounded-xl bg-slate-900/60 p-2.5 hover:bg-slate-900 text-xs text-slate-300 cursor-pointer border border-slate-800"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-cyan-400 font-semibold">{item.id}</span>
                          <span className="truncate">{item.raw_text}</span>
                        </div>
                        <span className="text-slate-500 font-mono shrink-0 ml-2">
                          {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-over Ticket Drawer */}
      <TicketDrawer
        ticket={activeTicket}
        onClose={() => setActiveTicket(null)}
        onUpdate={handleTicketUpdate}
      />
    </div>
  );
}
