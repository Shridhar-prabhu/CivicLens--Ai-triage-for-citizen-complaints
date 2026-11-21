"use strict";
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Send, ArrowLeft, Bot, CheckCheck, Sparkles, MessageSquare, ShieldAlert, MapPin } from "lucide-react";
import type { Ticket } from "@/lib/schema";
import { preFilterIntent } from "@/lib/intent";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  time: string;
  ticket?: Ticket;
}

type ConversationState = "idle" | "awaiting_details" | "awaiting_confirmation";

export default function WhatsAppDemoPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Namaste! Welcome to Bangalore Municipal Corporation Civic Helpline (Simulated WhatsApp Bot).\n\nDescribe the issue, add a photo if you can. Type 'status <ID>' to track a ticket, or type 'help' for options.",
      time: "10:00 AM",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convState, setConvState] = useState<ConversationState>("idle");
  const [pendingText, setPendingText] = useState("");
  const [pendingTriage, setPendingTriage] = useState<any>(null);
  const [simulatedLocation, setSimulatedLocation] = useState<{
    lat: number;
    lng: number;
    address_text: string;
  } | null>(null);

  const getTimeString = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const addBotMessage = (text: string, ticket?: Ticket) => {
    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text,
        time: getTimeString(),
        ticket,
      },
    ]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = input.trim();
    if (!rawInput || loading) return;

    // Append user message
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: rawInput, time: getTimeString() },
    ]);
    setInput("");
    setLoading(true);

    try {
      // 1. STATE: Awaiting Confirmation (User previously triaged a complaint)
      if (convState === "awaiting_confirmation" && pendingTriage) {
        const lower = rawInput.toLowerCase().trim();
        if (lower === "yes" || lower === "y" || lower === "haan" || lower === "submit" || lower === "ok") {
          // Officially create ticket in backend
          const res = await fetch("/api/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: pendingTriage.raw_text || pendingText,
              channel: "whatsapp",
              lat: simulatedLocation?.lat,
              lng: simulatedLocation?.lng,
              address_text: simulatedLocation?.address_text,
              location_source: simulatedLocation ? "gps" : "none",
            }),
          });
          const ticket: Ticket = await res.json();

          addBotMessage(
            `✅ *Ticket #${ticket.id} Successfully Registered!*\n\n` +
            `• Category: ${ticket.category}\n` +
            `• Severity: ${ticket.severity} (${ticket.severity_reason})\n` +
            `• Routed To: ${ticket.department}\n` +
            (ticket.address_text ? `• Location: ${ticket.address_text} (Simulated GPS)\n` : "") +
            (ticket.duplicate_note ? `• Clustering: ${ticket.duplicate_note}\n` : "") +
            `• SLA Resolution Target: ${ticket.sla_hours} hours\n\n` +
            `You can track live field updates here: /track/${ticket.id}`,
            ticket
          );
          setConvState("idle");
          setPendingTriage(null);
          setPendingText("");
          setSimulatedLocation(null);
        } else if (lower === "edit" || lower === "no" || lower === "change") {
          addBotMessage(
            "Understood. Please re-type your complaint with the corrected details, location, and issue description."
          );
          setConvState("idle");
          setPendingTriage(null);
          setPendingText("");
        } else {
          addBotMessage(
            "Please reply *YES* to confirm and dispatch this ticket, or *EDIT* to change the details."
          );
        }
        setLoading(false);
        return;
      }

      // 2. STATE: Awaiting Follow-up Details (User previously sent vague message)
      let textToTriage = rawInput;
      if (convState === "awaiting_details" && pendingText) {
        textToTriage = `${pendingText}. Location and issue details: ${rawInput}`;
        setConvState("idle");
        setPendingText("");
      }

      // 3. Fast Rule-Based Intent Pre-Filter
      const pre = preFilterIntent(textToTriage);

      if (pre.isPreFiltered && pre.intent !== "complaint") {
        if (pre.intent === "greeting") {
          addBotMessage(
            "Namaste! Welcome to Bangalore Municipal Corporation Civic Helpline.\n\n" +
            "• Describe the issue, add a photo if you can.\n" +
            "• Type 'status <ID>' to track a ticket.\n" +
            "• Type 'help' to see what I can do."
          );
        } else if (pre.intent === "help") {
          addBotMessage(
            pre.botReply ||
            "🤖 *CivicLens Bot Capabilities:*\n\n" +
            "1. *File Complaints*: Potholes, broken streetlights, water leaks, garbage, fallen trees, open drains.\n" +
            "2. *Languages*: English, Hindi, Kannada, or mixed text.\n" +
            "3. *Track Status*: Type 'status <TicketID>' to check resolution progress."
          );
        } else if (pre.intent === "status_query") {
          const ticketId = pre.extractedTicketId;
          if (ticketId) {
            const checkRes = await fetch(`/api/tickets/${ticketId}`);
            if (checkRes.ok) {
              const t: Ticket = await checkRes.json();
              addBotMessage(
                `🔍 *Status for Ticket #${t.id}:*\n\n` +
                `• Summary: ${t.summary}\n` +
                `• Category: ${t.category} (${t.severity})\n` +
                `• Routed To: ${t.department}\n` +
                `• Current Status: *${t.status.toUpperCase()}*\n` +
                `• SLA Target: ${t.sla_hours}h (${t.is_overdue ? "OVERDUE" : "Within SLA"})\n\n` +
                `View live tracking timeline: /track/${t.id}`,
                t
              );
            } else {
              addBotMessage(`❌ Ticket '${ticketId}' was not found in the municipal system. Please verify your reference ID.`);
            }
          } else {
            addBotMessage("Please provide your ticket reference number, e.g. 'status CVL-101001'.");
          }
        } else if (pre.intent === "chitchat_or_non_civic") {
          addBotMessage(
            "Thank you! Please reach out anytime you encounter civic issues (roads, garbage, water, electricity, drainage, trees). Have a great day!"
          );
        } else if (pre.intent === "needs_more_info") {
          addBotMessage("Which area or landmark, and what is the issue? (e.g. 'Pothole on 100ft road near Metro station')");
          setConvState("awaiting_details");
          setPendingText(textToTriage);
        }
        setLoading(false);
        return;
      }

      // 4. Intent is a Complaint -> Run Triage Pipeline (Do NOT create ticket yet)
      const triageRes = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToTriage }),
      });

      const triageData = await triageRes.json();

      // If AI determined intent is not complaint
      if (triageData.intent && triageData.intent !== "complaint") {
        if (triageData.intent === "needs_more_info") {
          addBotMessage("Which area or landmark, and what is the issue?");
          setConvState("awaiting_details");
          setPendingText(textToTriage);
        } else {
          addBotMessage(triageData.suggested_action || "Please describe a specific civic issue to report.");
        }
        setLoading(false);
        return;
      }

      // Show Confirmation Step (Requirement 3: "Reply YES to submit or EDIT to change")
      setPendingTriage({ ...triageData, raw_text: textToTriage });
      setConvState("awaiting_confirmation");

      addBotMessage(
        `📝 *I understood:*\n` +
        `• Summary: ${triageData.summary}\n` +
        `• Category: *${triageData.category}*\n` +
        `• Severity: *${triageData.severity}* (${triageData.severity_reason})\n` +
        `• Routed Department: ${triageData.department}\n` +
        (simulatedLocation ? `• Attached Location: ${simulatedLocation.address_text} (Simulated GPS)\n\n` : "\n") +
        `👉 *Reply YES to submit* or *EDIT* to change details.`
      );
    } catch {
      addBotMessage("Unable to reach triage service right now. Please try again.");
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
          Simulated WhatsApp intake
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
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <MessageSquare className="h-3 w-3 text-cyan-400" />
            <span>Intent Filter Active</span>
          </div>
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
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60">
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
                <span>CivicLens AI checking intent &amp; triaging...</span>
              </div>
            </div>
          )}
        </div>

        {/* State Banner */}
        {convState === "awaiting_confirmation" && (
          <div className="bg-amber-500/10 border-t border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-300">
            <span>Awaiting your confirmation to submit</span>
            <span className="font-mono font-bold">Reply YES / EDIT</span>
          </div>
        )}

        {/* Location Attachment Bar (Simulated WhatsApp Location Sharing) */}
        <div className="bg-[#17212b] px-3 py-1.5 flex items-center justify-between border-t border-[#2a3942] text-xs">
          <button
            type="button"
            onClick={() => {
              if (simulatedLocation) {
                setSimulatedLocation(null);
              } else {
                setSimulatedLocation({
                  lat: 12.92501,
                  lng: 77.59382,
                  address_text: "5th Cross, Jayanagar, Bengaluru",
                });
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              simulatedLocation
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-[#202c33] text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <MapPin className="h-3 w-3 text-cyan-400" />
            <span>
              {simulatedLocation
                ? "📍 5th Cross Jayanagar (Simulated GPS Active)"
                : "📍 Share location (Simulated)"}
            </span>
          </button>
          <span className="text-[10px] text-slate-400">Attach coordinates</span>
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="bg-[#1f2c34] p-3 flex items-center gap-2 border-t border-[#2a3942]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              convState === "awaiting_confirmation"
                ? "Reply 'YES' to submit or 'EDIT' to change..."
                : convState === "awaiting_details"
                ? "Provide location and defect details..."
                : "Type complaint, 'status <ID>', or 'help'..."
            }
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
