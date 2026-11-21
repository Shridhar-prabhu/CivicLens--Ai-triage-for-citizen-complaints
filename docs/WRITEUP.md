# CivicLens: Autonomous AI Triage & Dispatch Platform for Municipal Governance

**Event**: Prompt to Product Hackathon  
**Track**: CivicLens — AI Triage for Citizen Complaints  
**Team**: CivicLens Engineering Team  

---

## 1. Problem Interpretation & Domain Context

Municipal corporations receive tens of thousands of citizen grievances daily across web portals, social media, and WhatsApp groups. In municipal reality, these complaints suffer from four critical operational bottlenecks:
1. **Linguistic Diversity & Ambiguity**: Citizens file in English, regional languages (Hindi, Kannada), or colloquial romanized transliterations (Hinglish/Kanglish) with vague descriptions ("something broke").
2. **Duplicate Avalanche**: When a main water pipe bursts on a busy road, hundreds of residents file independent complaints within hours, overwhelming call centers and creating duplicate contractor work orders.
3. **Misrouting & Departmental Silos**: Citizens rarely know whether an open street drain falls under the Roads Department or the Storm Water Drain Department (SWD). Misrouted tickets bounce between departments for weeks.
4. **Severity Inversion**: Vague or minor cosmetic issues often bury emergency life-safety hazards (such as exposed 440V live wires outside primary schools).

**CivicLens** solves this by establishing a dual-sided, automated triage engine that converts unstructured multimodal citizen complaints into structured, prioritised, deduplicated, and correctly routed tickets that municipal officers can act on immediately.

---

## 2. Technical Architecture & System Pipeline

```
  [ Citizen Ingestion ] ──────> Free Text (English/Hindi/Kannada) + Photo
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                 CivicLens Triage Pipeline                   │
│                                                             │
│  1. Ingestion & Schema Validation (Zod)                     │
│  2. Multimodal AI Analysis (Gemini 1.5 Flash via REST)     │
│     • Multilingual translation to clear English             │
│     • Categorization (Roads, Waste, Water, Electricity,...) │
│     • Severity Rubric (Critical, High, Medium, Low)         │
│     • Visual Hazard Confirmation (image_changed_result)     │
│  3. Resilient Fallback Engine (/lib/fallback.ts)            │
│     • Deterministic keyword scoring & ambiguity overrides   │
│     • Transparent "AI" vs "Fallback" badge assignment       │
│  4. Operational Telemetry Layer                             │
│     • Transparent Priority Score (0-100 breakdown)          │
│     • Spatial/Category Duplicate Clustering                 │
│     • SLA Timers (Critical 2h, High 24h, Med 72h, Low 7d)  │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│            Municipal Command & Control Dashboard            │
│  • Priority Sorted Queue (Critical > High > Med > Low)      │
│  • Real-time Analytics (Recharts Category & Severity Split) │
│  • Officer Override & Audit Trail Logging                   │
│  • Citizen Tracking Timeline (/track/[id])                  │
│  • Simulated WhatsApp Channel (/whatsapp-demo)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Thoughtful AI Use & Prompt Engineering

Rather than deploying a generic conversational chatbot wrapper, CivicLens employs a calibrated system prompt with strict output constraints:
- **Strict Response Schema**: Forces single-call JSON extraction containing category, severity, one-line severity reason, department, 20-word summary, language, translation, location hint, and suggested action.
- **Visual Evidence Anchoring**: When a photo is provided, the prompt instructs the model to describe visual hazards and evaluate if visual ground truth contradicts citizen text.
- **Resilient Fallback**: A multi-lingual keyword triage fallback engine in `/lib/fallback.ts` ensures zero-downtime operation even under network drops or API rate limiting.
- **Transparent Scoring**: A composite 0–100 Priority Score breaks down Base Severity (up to 50 pts), Sensitive Proximity Boost (+20 pts for schools/hospitals), Duplicate Volume (+5 pts per cluster report), and Aging (+2 pts per 6 hours open).

---

## 4. Limitations & Edge Cases

1. **Fallback Translation Inability**: While the keyword fallback correctly classifies categories and detects critical urgency signals in English, Hindi, and Kannada, it cannot translate text into English. The UI honestly displays "Translation unavailable in fallback mode".
2. **GPS Geofencing**: Current prototype extracts landmarks and textual location hints. Production deployment would integrate reverse geocoding with municipal GIS shapefiles.
3. **Bandwidth in Remote Wards**: Large images can introduce upload latency on 2G/3G connections; client-side image compression before upload is recommended.

---

## 5. Credits & External Assets

- **Framework**: Next.js 14 App Router, React 18, TypeScript 5.
- **Styling & UI**: Tailwind CSS, Lucide React Icons, Framer Motion.
- **Data Visualization**: Recharts.
- **Validation**: Zod schema library.
- **AI Engine**: Google Gemini 1.5 Flash API.
- **Sample Visual Assets**: Self-generated SVG vector graphics (`/public/samples/hazard-tree.jpg`).
- **Development Tooling**: Node.js v26 LTS, MinGit 2.44.
