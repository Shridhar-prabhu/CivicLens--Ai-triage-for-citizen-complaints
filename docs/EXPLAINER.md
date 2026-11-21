# CivicLens — Jury Q&A & Code Explainer Guide

> **Cheat Sheet for Team Members**: Plain-English walkthrough of each file, architecture decision, and prompt design so every member can answer jury questions confidently.

---

## 1. Quick Technical Q&A for Judges

### Q1: "How does the system classify regional languages like Hindi or Kannada?"
> **Answer**: "We pass the raw text directly to Gemini 1.5 Flash with our strict `SYSTEM_PROMPT` in `/lib/prompts.ts`. The prompt explicitly instructs the model to detect the source language, translate it into standard English, and extract civic entities. For offline resilience, our `/lib/fallback.ts` detects Unicode ranges (`\u0900-\u097F` for Devanagari Hindi, `\u0C80-\u0CFF` for Kannada) and matches multilingual civic keywords."

### Q2: "How do you prevent hallucinations or made-up departments?"
> **Answer**: "We enforce strict category-to-department mapping in the system prompt and validate the entire payload against a strict Zod schema in `/lib/schema.ts`. If the AI returns an unknown department or invalid JSON, it retries once. If it fails twice, our deterministic fallback takes over."

### Q3: "What is your innovation beyond a typical wrapper or chatbot?"
> **Answer**: 
> 1. **Multimodal Visual Verification**: Photos can override or confirm citizen text via `image_changed_result`.
> 2. **Duplicate Clustering**: We group complaints with matching categories and overlapping location hints to avoid sending 5 different crews to the same burst pipe.
> 3. **Transparent Priority Scoring (0-100)**: We show officers exactly 'Why this rank' based on severity, proximity to schools/hospitals, report frequency, and aging.
> 4. **Officer Override & Audit Trail**: Officers can reclassify tickets, and the system tracks agreement rate in real time.
> 5. **SLA Timers & Public Citizen Tracking**: Automated 2h, 24h, 72h countdowns with overdue flags and a dedicated `/track/[id]` view.

### Q4: "What happens if the Gemini API goes down or hits rate limits during our demo?"
> **Answer**: "CivicLens has zero demo failure risk. If the API fails or is unconfigured, it seamlessly and instantly switches to `/lib/fallback.ts` within 20 milliseconds, assigning accurate categories and severities with an honest 'Keyword Fallback' badge."

### Q5: "How does your duplicate clustering work with GPS coordinates and text?"
> **Answer**: "We employ a dual-strategy duplicate engine in `/lib/duplicates.ts`:
> 1. **Geospatial Haversine Distance**: When two tickets in the same category have GPS coordinates, we compute their great-circle distance using the Haversine formula (`/lib/geo.ts`). If the distance is under 75 meters, they are unified into the same duplicate cluster, displaying an exact proximity tag like `~24 m from #CVL-101001`.
> 2. **Text Jaccard Fallback**: If coordinates are absent or permission is denied, the system gracefully falls back to tokenized Jaccard similarity across normalized location hints.
> 3. **Privacy First**: Exact device coordinates are never shown to the public on `/track/[id]`; only verified ward street addresses are displayed."

### Q6: "Why did you use Leaflet and OpenStreetMap instead of Google Maps?"
> **Answer**: "OpenStreetMap with Leaflet provides zero-cost, open-source compliance with no paid API keys that could expire during a competition demo. To ensure stability in Next.js App Router, all map components are dynamically imported with `ssr: false` to avoid SSR `window is not defined` errors. Nominatim reverse geocoding is strictly fired on user button click (not during pin drags) and wrapped in silent fail-safes."

### Q7: "How is access control handled between citizens and officers?"
> **Answer**: "We enforce strict two-tier role-based access control:
> 1. **Zero-Friction Anonymous Citizens**: Citizens file complaints and track status on `/`, `/whatsapp-demo`, and `/track/[id]` without creating an account. Public APIs sanitize records, stripping internal notes, audit logs, and raw GPS.
> 2. **Server-Enforced Officer Authorization**: Next.js `middleware.ts` guards `/dashboard` and redirects unauthenticated users to `/login`. Officer API endpoints (`GET /api/tickets`, `GET /api/stats`, `PATCH /api/tickets/[id]`) verify signed, httpOnly HMAC-SHA256 JWT cookies, returning `401 Unauthorized` or `403 Forbidden` if missing.
> 3. **Named Officer Auditability**: Every status update and reclassification override binds the authenticated officer's exact name and department into the immutable audit trail."

---

## 2. File-by-File Guide

- `lib/schema.ts`: Defines Zod schemas for `TriageResult`, `Ticket`, `PriorityBreakdown`, `LocationSource`, and `AuditEvent`.
- `lib/auth.ts`: Zero-dependency Web Crypto authentication, password hashing, signed JWT cookies, and seed accounts.
- `middleware.ts`: Next.js Edge route guard protecting `/dashboard` and redirecting unauthenticated visitors to `/login`.
- `lib/geo.ts`: Haversine formula (<75 m threshold), Bengaluru center coordinates, and safe reverse geocoding via Nominatim.
- `lib/prompts.ts`: Contains the verbatim `SYSTEM_PROMPT` and `IMAGE_PROMPT_INSTRUCTION`.
- `lib/fallback.ts`: Deterministic keyword matcher across 7 categories with priority bumping and language detection.
- `lib/priority.ts`: Calculates the transparent 0–100 Priority Score and human-readable breakdown.
- `lib/duplicates.ts`: Dual-mode duplicate detector: Haversine distance (<75 m) with fallback to Jaccard text similarity.
- `lib/sla.ts`: Assigns SLA deadlines (Critical 2h, High 24h, Med 72h, Low 7d) and calculates remaining time.
- `lib/db.ts`: In-memory + atomic JSON file storage in `/data/tickets.json` seeded with 15 realistic civic complaints.
- `components/MapPicker.tsx`: Citizen intake map with draggable pin and OpenStreetMap tiles.
- `components/DashboardMapView.tsx`: Municipal command map view with severity-colored pins (Critical pulsing red) and cluster badges.
- `components/MiniMap.tsx`: Read-only pin map displayed in officer ticket drawer.
- `app/api/auth/login/route.ts`: Login API with 1-click demo sign-in and credential validation setting httpOnly cookie.
- `app/api/auth/logout/route.ts`: Logout API that expires the session cookie.
- `app/api/auth/me/route.ts`: Current officer session reader.
- `app/api/triage/route.ts`: API endpoint with Gemini REST call, timeout abort controller, retry, and fallback.
- `app/api/tickets/route.ts`: GET (officer-only protected list) and POST (public citizen intake with clustering and SLA).
- `app/page.tsx`: Landing page with hero, preset buttons, voice input, map pin picker, and ticket card reveal.
- `app/dashboard/page.tsx`: Municipal Officer Command Center with KPI stats, Recharts graphs, map view tab, and ticket drawer.
- `app/track/[id]/page.tsx`: Citizen tracking timeline with privacy masking.
- `app/whatsapp-demo/page.tsx`: Simulated WhatsApp conversational intake channel with simulated location sharing.
