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

---

## 2. File-by-File Guide

- `lib/schema.ts`: Defines Zod schemas for `TriageResult`, `Ticket`, `PriorityBreakdown`, and `AuditEvent`.
- `lib/prompts.ts`: Contains the verbatim `SYSTEM_PROMPT` and `IMAGE_PROMPT_INSTRUCTION`.
- `lib/fallback.ts`: Deterministic keyword matcher across 7 categories with priority bumping and language detection.
- `lib/priority.ts`: Calculates the transparent 0–100 Priority Score and human-readable breakdown.
- `lib/duplicates.ts`: Calculates token similarity (Jaccard) on location hints and categories to cluster duplicates.
- `lib/sla.ts`: Assigns SLA deadlines (Critical 2h, High 24h, Med 72h, Low 7d) and calculates remaining time.
- `lib/db.ts`: In-memory + atomic JSON file storage in `/data/tickets.json` seeded with 15 realistic civic complaints.
- `app/api/triage/route.ts`: API endpoint with Gemini REST call, timeout abort controller, retry, and fallback.
- `app/api/tickets/route.ts`: GET (priority-sorted list) and POST (create ticket with clustering and SLA).
- `app/page.tsx`: Landing page with hero, preset buttons, voice input, progress modal, and ticket card reveal.
- `app/dashboard/page.tsx`: Municipal Officer Command Center with KPI stats, Recharts graphs, and ticket drawer.
- `app/track/[id]/page.tsx`: Citizen tracking timeline.
- `app/whatsapp-demo/page.tsx`: Simulated WhatsApp conversational intake channel.
