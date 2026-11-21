"use strict";
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Send, ArrowLeft, Bot, User, CheckCheck, Sparkles, AlertCircle } from "lucide-react";
import type { Ticket } from "@/lib/schema";

export default function WhatsAppDemoPage() {
  const [messages, setMessages] = useState<Array<{ sender: "user" | "bot"; text: string; time: string; ticket?: Ticket }>>([
    {
      sender: "bot",
      text: "Namaste! Welcome to Bangalore Municipal Corporation Civic Helpline (Simulated WhatsApp Bot). Please describe your civic issue in English, Hindi, or Kannada.",
      time: "10:00 AM",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [...prev, { sender: "user", text: userText, time: nowTime }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText, channel: "whatsapp" }),
      });

      const ticket: Ticket = await res.json();

      const replyText = `✅ Ticket #${ticket.id} Registered!\n\n• Category: ${ticket.category}\n• Severity: ${ticket.severity} (${ticket.severity_reason})\n• Routed To: ${ticket.department}\n• SLA Target: ${ticket.sla_hours} hours\n\nTrack progress online: /track/${ticket.id}`;

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          ticket,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, unable to process your complaint right now. Please try again.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400">
          <ArrowLeft className="h-4 w-4" /> Back to CivicLens
        </Link>
        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
          Simulated WhatsApp Intake
        </span>
      </div>

      {/* Phone Screen Mockup */}
      <div className="rounded-3xl border border-slate-800 bg-[#0b141a] overflow-hidden shadow-2xl">
        {/* WhatsApp Header */}
        <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-[#2a3942]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">CivicLens Municipal Bot</h3>
              <p className="text-[11px] text-emerald-400">Automated AI Triage Helpline</p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Channel: WhatsApp</span>
        </div>

        {/* Message Thread */}
        <div className="p-4 h-[440px] overflow-y-auto space-y-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-sm ${
                  m.sender === "user"
                    ? "bg-[#005c4b] text-slate-100 rounded-tr-none"
                    : "bg-[#202c33] text-slate-200 rounded-tl-none border border-slate-700/40"
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                {m.ticket && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60">
                    <Link
                      href={`/track/${m.ticket.id}`}
                      className="text-cyan-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      Track #{m.ticket.id} on Citizen Portal &rarr;
                    </Link>
                  </div>
                )}
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-1">
                  <span>{m.time}</span>
                  {m.sender === "user" && <CheckCheck className="h-3 w-3 text-cyan-400" />}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#202c33] text-cyan-400 text-xs px-3 py-2 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                <span>CivicLens AI is triaging complaint...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={sendMessage} className="bg-[#1f2c34] p-3 flex items-center gap-2 border-t border-[#2a3942]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type complaint in Hindi, Kannada or English..."
            className="flex-1 rounded-xl bg-[#2a3942] px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-9 w-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
