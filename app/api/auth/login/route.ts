import { NextRequest, NextResponse } from "next/server";
import {
  DEMO_OFFICERS,
  verifyPassword,
  signSession,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, officer_id } = body;

    let officer = null;

    // 1. One-click demo login by officer_id
    if (officer_id) {
      officer = DEMO_OFFICERS.find((o) => o.id === officer_id);
      if (!officer) {
        return NextResponse.json({ error: "Demo officer account not found" }, { status: 404 });
      }
    }
    // 2. Email & Password login
    else if (email && password) {
      const found = DEMO_OFFICERS.find((o) => o.email.toLowerCase() === email.toLowerCase().trim());
      if (!found) {
        return NextResponse.json({ error: "Invalid officer credentials" }, { status: 401 });
      }

      const isValid = await verifyPassword(password, found.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid officer credentials" }, { status: 401 });
      }
      officer = found;
    } else {
      return NextResponse.json(
        { error: "Please provide either officer_id or email and password" },
        { status: 400 }
      );
    }

    // Sign session JWT
    const token = await signSession({
      id: officer.id,
      name: officer.name,
      email: officer.email,
      role: officer.role,
      department: officer.department,
      title: officer.title,
    });

    const response = NextResponse.json({
      success: true,
      officer: {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        department: officer.department,
        title: officer.title,
      },
    });

    // Set signed httpOnly cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("[POST /api/auth/login] Error:", err);
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}
