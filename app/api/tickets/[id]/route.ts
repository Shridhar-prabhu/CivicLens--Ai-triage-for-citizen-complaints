import { NextRequest, NextResponse } from "next/server";
import { getTicketById, updateTicketStatus, applyOfficerOverride } from "@/lib/db";
import { OfficerOverrideSchema } from "@/lib/schema";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ticket = getTicketById(params.id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  return NextResponse.json(ticket);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // Direct status update
    if (body.action === "update_status" && body.status) {
      const updated = updateTicketStatus(params.id, body.status, body.officer_name || "Officer");
      if (!updated) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    // Officer override
    const parsed = OfficerOverrideSchema.parse({
      ...body,
      ticket_id: params.id,
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
