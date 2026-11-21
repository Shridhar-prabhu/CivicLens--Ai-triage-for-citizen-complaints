import { NextRequest, NextResponse } from "next/server";
import { getAllTickets, saveTicket, getTicketById } from "@/lib/db";
import { findPossibleDuplicate } from "@/lib/duplicates";
import { calculatePriorityScore } from "@/lib/priority";
import { calculateSLADeadline } from "@/lib/sla";
import { fallbackTriage } from "@/lib/fallback";
import { preFilterIntent } from "@/lib/intent";
import { SYSTEM_PROMPT, IMAGE_PROMPT_INSTRUCTION } from "@/lib/prompts";
import { TriageResultSchema, type Ticket, type Category, type Severity, type TicketStatus } from "@/lib/schema";
import { getSessionFromRequest } from "@/lib/auth";

const SEVERITY_ORDER: Record<Severity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export async function GET(req: NextRequest) {
  try {
    // Server-side authentication check (Requirement 3)
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Officer authentication required to list municipal tickets." },
        { status: 401 }
      );
    }
    if (session.role !== "officer") {
      return NextResponse.json(
        { error: "Forbidden. Officer role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const department = searchParams.get("department");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.toLowerCase();

    let tickets = getAllTickets();

    // Filters
    if (category && category !== "all") {
      tickets = tickets.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }
    if (department && department !== "all") {
      tickets = tickets.filter((t) => t.department.toLowerCase() === department.toLowerCase());
    }
    if (severity && severity !== "all") {
      tickets = tickets.filter((t) => t.severity.toLowerCase() === severity.toLowerCase());
    }
    if (status && status !== "all") {
      tickets = tickets.filter((t) => t.status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      tickets = tickets.filter(
        (t) =>
          t.summary.toLowerCase().includes(search) ||
          t.raw_text.toLowerCase().includes(search) ||
          t.location_hint.toLowerCase().includes(search) ||
          t.id.toLowerCase().includes(search) ||
          t.department.toLowerCase().includes(search)
      );
    }

    // Required sorting (Feature 5): Priority first (Critical > High > Medium > Low), then newest first
    tickets.sort((a, b) => {
      const pDiff = (SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0);
      if (pDiff !== 0) return pDiff;
      // Secondary: higher priority score
      if (b.priority_score !== a.priority_score) {
        return b.priority_score - a.priority_score;
      }
      // Tertiary: newest created_at first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ tickets, total: tickets.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawText = body.text?.trim();

    if (!rawText || rawText.length < 2) {
      return NextResponse.json({ error: "Complaint text is required" }, { status: 400 });
    }

    // 0. Fast Intent Pre-Filter (Rule-based)
    const pre = preFilterIntent(rawText);
    if (pre.isPreFiltered && pre.intent !== "complaint") {
      let statusTicket = null;
      if (pre.intent === "status_query" && pre.extractedTicketId) {
        statusTicket = getTicketById(pre.extractedTicketId);
      }

      return NextResponse.json({
        is_ticket: false,
        intent: pre.intent,
        bot_reply: pre.botReply,
        extracted_ticket_id: pre.extractedTicketId,
        status_ticket: statusTicket,
        message: pre.botReply || `Message recognized as ${pre.intent}. No ticket created.`,
      });
    }

    // 1. Triage the complaint
    let triageData: any = null;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== "your_gemini_api_key_here") {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        let promptText = rawText;
        const parts: any[] = [];

        if (body.image_base64 && body.image_mime) {
          promptText += `\n\n${IMAGE_PROMPT_INSTRUCTION}`;
          parts.push({ text: promptText });
          parts.push({
            inlineData: {
              mimeType: body.image_mime,
              data: body.image_base64,
            },
          });
        } else {
          parts.push({ text: promptText });
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
          }),
        });

        if (res.ok) {
          const aiJson = await res.json();
          const raw = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw);
            triageData = TriageResultSchema.parse({
              ...parsed,
              source: "ai",
              image_changed_result: parsed.image_changed_result === true,
            });
          }
        }
      } catch (err) {
        console.warn("[Tickets API] AI triage threw error, falling back:", err);
      }
    }

    // Fallback if AI was unavailable or failed
    if (!triageData) {
      const fb = fallbackTriage(rawText);
      triageData = { ...fb, source: "fallback" };
    }

    // If AI or Fallback determined intent is NOT complaint, do not create a ticket!
    if (triageData.intent && triageData.intent !== "complaint") {
      return NextResponse.json({
        is_ticket: false,
        intent: triageData.intent,
        bot_reply: triageData.suggested_action,
        message: triageData.suggested_action || `Message categorized as ${triageData.intent}. No ticket created.`,
      });
    }

    const existingTickets = getAllTickets();

    // 2. Duplicate clustering (Haversine <= 75m or Textual Fallback)
    const dupCheck = findPossibleDuplicate(
      {
        category: triageData.category,
        location_hint: triageData.location_hint,
        raw_text: rawText,
        lat: typeof body.lat === "number" ? body.lat : undefined,
        lng: typeof body.lng === "number" ? body.lng : undefined,
      },
      existingTickets
    );

    // 3. Transparent Priority Score Calculation
    const { score, breakdown } = calculatePriorityScore({
      severity: triageData.severity,
      urgency_signals: triageData.urgency_signals,
      duplicate_count: dupCheck.clusterCount,
    });

    // 4. SLA Calculation
    const { slaHours, deadlineIso } = calculateSLADeadline(triageData.severity);

    // 5. Build Final Ticket Object
    const ticketId = `CVL-${Date.now().toString().slice(-6)}`;
    const createdAtIso = new Date().toISOString();

    const newTicket: Ticket = {
      id: ticketId,
      created_at: createdAtIso,
      raw_text: rawText,
      image_url: body.image_url || (body.image_base64 ? `data:${body.image_mime || "image/jpeg"};base64,${body.image_base64}` : undefined),
      
      // Location fields
      lat: typeof body.lat === "number" ? body.lat : undefined,
      lng: typeof body.lng === "number" ? body.lng : undefined,
      address_text: body.address_text || triageData.location_hint || undefined,
      location_source: body.location_source || (typeof body.lat === "number" ? "map_pin" : "none"),

      intent: "complaint",
      category: triageData.category,
      severity: triageData.severity,
      severity_reason: triageData.severity_reason,
      department: triageData.department,
      summary: triageData.summary,
      detected_language: triageData.detected_language,
      translated_text: triageData.translated_text,
      location_hint: body.address_text || triageData.location_hint || "",
      confidence: triageData.confidence,
      suggested_action: triageData.suggested_action,
      urgency_signals: triageData.urgency_signals,
      image_changed_result: triageData.image_changed_result || false,
      source: triageData.source,

      status: "open",
      assigned_to: "Unassigned",
      priority_score: score,
      priority_breakdown: breakdown,
      sla_hours: slaHours,
      sla_deadline: deadlineIso,
      is_overdue: false,

      cluster_id: dupCheck.clusterId,
      duplicate_count: dupCheck.clusterCount,
      possible_duplicate_of: dupCheck.duplicateOfId,
      duplicate_distance_meters: dupCheck.distanceMeters,
      duplicate_note: dupCheck.duplicateNote,

      needs_human_review: triageData.confidence < 0.6,
      is_overridden: false,

      audit_trail: [
        {
          id: `evt-${Date.now()}`,
          timestamp: createdAtIso,
          actor: triageData.source === "ai" ? "Gemini 1.5 Flash (AI)" : "Keyword Fallback Engine",
          action: "TRIAGED",
          details: `Ticket generated via ${triageData.source.toUpperCase()}. Assigned severity ${triageData.severity} -> ${triageData.department}. Priority Score: ${score}/100.`,
        },
      ],
    };

    saveTicket(newTicket);

    return NextResponse.json(newTicket, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/tickets] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
