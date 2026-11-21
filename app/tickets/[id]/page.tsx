"use strict";
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TicketCard } from "@/components/TicketCard";
import type { Ticket } from "@/lib/schema";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tickets/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setTicket(data);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mx-auto mb-3" />
        <p className="text-sm">Loading ticket details...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Ticket Not Found</h3>
        <p className="text-sm text-slate-400">The requested civic complaint could not be found.</p>
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white">
          <ArrowLeft className="h-4 w-4" /> Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400">
          <ArrowLeft className="h-4 w-4" /> Back to Report Issue
        </Link>
        <Link href={`/track/${ticket.id}`} className="text-xs font-mono text-cyan-400 hover:underline">
          View Live Tracking Timeline &rarr;
        </Link>
      </div>

      <TicketCard ticket={ticket} />
    </div>
  );
}
