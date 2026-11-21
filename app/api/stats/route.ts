import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Officer authentication required to view municipal statistics." },
        { status: 401 }
      );
    }
    if (session.role !== "officer") {
      return NextResponse.json(
        { error: "Forbidden. Officer role required." },
        { status: 403 }
      );
    }

    const stats = getDashboardStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
