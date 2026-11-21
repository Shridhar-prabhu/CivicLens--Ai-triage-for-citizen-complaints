/**
 * CivicLens Authentication & Session Management
 * 
 * Features:
 * - Zero-dependency native Web Crypto API (HMAC SHA-256 signed JWT session tokens)
 * - Compatible with Next.js Edge Middleware and Node.js App Router
 * - Seeded demo officer accounts with SHA-256 hashed passwords
 * - Secure httpOnly, sameSite="lax" cookie sessions
 */

import { NextRequest } from "next/server";

export interface OfficerUser {
  id: string;
  name: string;
  email: string;
  role: "officer";
  department: string;
  title: string;
  passwordHash: string; // SHA-256 hash
}

export interface OfficerSession {
  id: string;
  name: string;
  email: string;
  role: "officer";
  department: string;
  title: string;
  exp: number; // Unix epoch seconds
}

export const SESSION_COOKIE_NAME = "civiclens_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "civiclens-hackathon-officer-session-secret-key-2026-bangalore";

// Demo Password for all seed accounts: "officer123"
// SHA-256 hash: "118b8d35a17bcf2c7d2d790509e12308dc6332c5d234f0098d2d6be6700bebb1"
export const DEMO_OFFICERS: OfficerUser[] = [
  {
    id: "off-01",
    name: "Er. Ramesh Sharma",
    email: "ramesh@bbmp.gov.in",
    role: "officer",
    department: "Roads & Infrastructure",
    title: "Zonal Chief Engineer",
    passwordHash: "118b8d35a17bcf2c7d2d790509e12308dc6332c5d234f0098d2d6be6700bebb1",
  },
  {
    id: "off-02",
    name: "Smt. Ananya Rao",
    email: "ananya@bbmp.gov.in",
    role: "officer",
    department: "Solid Waste Management",
    title: "Ward 42 Executive Officer",
    passwordHash: "118b8d35a17bcf2c7d2d790509e12308dc6332c5d234f0098d2d6be6700bebb1",
  },
  {
    id: "off-03",
    name: "Er. Suresh Kumar",
    email: "suresh@bbmp.gov.in",
    role: "officer",
    department: "Water Supply & Sewerage Board",
    title: "Assistant Executive Engineer",
    passwordHash: "118b8d35a17bcf2c7d2d790509e12308dc6332c5d234f0098d2d6be6700bebb1",
  },
  {
    id: "off-04",
    name: "Smt. Priya Patel",
    email: "priya@bbmp.gov.in",
    role: "officer",
    department: "Electricity Dept / Streetlight Cell",
    title: "Duty Officer",
    passwordHash: "118b8d35a17bcf2c7d2d790509e12308dc6332c5d234f0098d2d6be6700bebb1",
  },
];

// Base64URL encoding/decoding helper
function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(str: string): Uint8Array {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/**
 * Computes SHA-256 hash of a string using Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verifies plaintext password against stored SHA-256 hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed.toLowerCase() === hash.toLowerCase();
}

/**
 * Signs a session object into an HMAC-SHA256 JWT string
 */
export async function signSession(
  payload: Omit<OfficerSession, "exp">,
  expiresInSeconds: number = 60 * 60 * 24 * 7 // 7 days
): Promise<string> {
  const enc = new TextEncoder();
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const sessionData: OfficerSession = { ...payload, exp };

  const header = bytesToBase64Url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = bytesToBase64Url(enc.encode(JSON.stringify(sessionData)));
  const data = enc.encode(`${header}.${body}`);

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", key, data as any);
  const sig = bytesToBase64Url(new Uint8Array(sigBuffer));

  return `${header}.${body}.${sig}`;
}

/**
 * Verifies an HMAC-SHA256 session token and returns the payload if valid
 */
export async function verifySession(token: string | null | undefined): Promise<OfficerSession | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const [header, body, sig] = parts;
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const data = enc.encode(`${header}.${body}`);

    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToBytes(sig);
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes as any, data as any);
    if (!valid) return null;

    const session = JSON.parse(dec.decode(base64UrlToBytes(body))) as OfficerSession;
    const now = Math.floor(Date.now() / 1000);
    if (session.exp && session.exp < now) {
      return null; // Expired
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies officer session from NextRequest (cookies or Authorization header)
 */
export async function getSessionFromRequest(
  req: NextRequest | Request
): Promise<OfficerSession | null> {
  // Check cookie first
  let token: string | null = null;

  if ("cookies" in req && typeof (req as any).cookies.get === "function") {
    token = (req as any).cookies.get(SESSION_COOKIE_NAME)?.value || null;
  }

  // Fallback to Cookie header
  if (!token) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  // Fallback to Authorization: Bearer <token>
  if (!token) {
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  return verifySession(token);
}
