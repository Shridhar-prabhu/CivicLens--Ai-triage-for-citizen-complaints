import { NextRequest, NextResponse } from "next/server";
import { getTicketById, updateTicketStatus, applyOfficerOverride } from "@/lib/db";
import { OfficerOverrideSchema } from "@/lib/schema";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ticket = getTicketById(params.id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const session = await getSessionFromRequest(req);

  // Authenticated officers get full operational record (audit trail, priority breakdown, overrides)
  if (session && session.role === "officer") {
    return NextResponse.json(ticket);
  }

  // Public citizen view (Requirements 3 & 4):
  // Never send officer-only fields (audit trail, internal notes, exact coordinates)
  const publicTicket = {
    id: ticket.id,
    summary: ticket.summary,
    raw_text: ticket.raw_text,
    category: ticket.category,
    severity: ticket.severity,
    severity_reason: ticket.severity_reason,
    department: ticket.department,
    status: ticket.status,
    address_text: ticket.address_text || ticket.location_hint,
    location_hint: ticket.location_hint,
    sla_hours: ticket.sla_hours,
    sla_deadline: ticket.sla_deadline,
    is_overdue: ticket.is_overdue,
    suggested_action: ticket.suggested_action,
    created_at: ticket.created_at,
    detected_language: ticket.detected_language,
    translated_text: ticket.translated_text,
    image_url: ticket.image_url,
    // Sensitive officer fields intentionally omitted:
    // - audit_trail (Officer actions & audit logs)
    // - officer_override (Internal reclassification notes)
    // - priority_score & priority_breakdown (Internal triage matrix)
    // - exact lat & lng coordinates (Citizen device privacy)
    // - cluster_id & duplicate details
  };

  return NextResponse.json(publicTicket);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Server-side officer authentication check (Requirement 3)
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Officer authentication required to update tickets." },
        { status: 401 }
      );
    }
    if (session.role !== "officer") {
      return NextResponse.json(
        { error: "Forbidden. Officer role required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const officerName = session.name;

    // Direct status update
    if (body.action === "update_status" && body.status) {
      const updated = updateTicketStatus(params.id, body.status, officerName);
      if (!updated) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    // Officer override
    const parsed = OfficerOverrideSchema.parse({
      ...body,
      ticket_id: params.id,
      officer_name: officerName,
    });

    const overridden = applyOfficerOverride(parsed);
    if (!overridden) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(overridden);
  } catch (err: any) {
    console.error("[PATCH /api/tickets/[id]] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
