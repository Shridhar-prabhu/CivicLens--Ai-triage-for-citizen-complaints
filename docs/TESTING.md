# CivicLens — AI Triage Testing & Prompt Calibration Report

> **Stage 8 Benchmark & Intent Filter Testing**: Evaluation of the triage pipeline against 15 edge-case complaints and 7 conversation intent scenarios.

---

## 1. Intent Detection Benchmark (WhatsApp Demo & Citizen Portal)

| # | User Input | Detected Intent | Action Taken | Ticket Created? | Match? |
|---|---|---|---|:---:|:---:|
| **1** | `"hi"` / `"namaste"` | `greeting` | Welcome message + filing instructions | ❌ No | ✅ |
| **2** | `"thanks"` / `"ok"` | `chitchat_or_non_civic` | Polite civic helpline acknowledgment | ❌ No | ✅ |
| **3** | `"help"` / `"menu"` | `help` | Capabilities and command list | ❌ No | ✅ |
| **4** | `"status CL-1042"` | `status_query` | Looks up ticket `#CL-1042` and returns live status | ❌ No | ✅ |
| **5** | `"something is wrong"` | `needs_more_info` | Asks follow-up: *"Which area and what is the issue?"* | ❌ No | ✅ |
| **6** | `"Electric wire fallen outside school in Jayanagar"` | `complaint` | Prompts confirmation: *"Reply YES to submit or EDIT to change"*. Ticket created on YES. | ✅ Yes (on YES) | ✅ |
| **7** | `"ನಮ್ಮ ಮನೆ ಹತ್ತಿರ ನೀರಿನ ಪೈಪ್ ಒಡೆದು ನೀರು ಹರಿಯುತ್ತಿದೆ"` | `complaint` | Prompts confirmation with Kannada detection. Ticket created on YES. | ✅ Yes (on YES) | ✅ |

---

## 2. 15-Case Complaint Triage Benchmark Matrix

| # | Complaint Input Description | Language | Expected Category | Expected Severity | Pipeline Result | Match? | Notes & Calibrations |
|---|---|---|---|---|---|:---:|---|
| **1** | Fallen live wire outside school footpath | English | Electricity | Critical | Electricity / Critical | ✅ | Sensitive location keyword ("school") boosted severity. Escalated to Critical. |
| **2** | Pothole biker accident on Hospital Road | Hindi | Roads | High | Roads / High | ✅ | Translated accurately from Hindi; urgency word "दुर्घटना/accident" detected. |
| **3** | Water main burst flooding road since morning | Kannada | Water | Critical | Water / Critical | ✅ | Identified "ಪೈಪ್ ಒಡೆ/main burst" and "ಬೆಳಿಗ್ಗೆಯಿಂದ ನೀರು ಬರುತ್ತಿಲ್ಲ/no supply". |
| **4** | Uncollected garbage for 3 days with foul smell | Hindi-Eng Mixed | Waste | Medium | Waste | Medium | ✅ | Categorized to Solid Waste Management; 24h SLA assigned. |
| **5** | Uprooted tree blocking arterial transit road | English + Photo | Trees | Critical | Trees / Critical | ✅ | `image_changed_result: true` confirmed road blockade from visual inspection. |
| **6** | Open broken manhole opposite bus stop | Hindi | Drainage | Critical | Drainage / Critical | ✅ | Overrode Roads ambiguity -> Drainage. Assigned 2h Critical SLA. |
| **7** | Sparking residential transformer with fire hazard | Kannada | Electricity | High | Electricity / High | ✅ | High urgency signals extracted ("sparks", "fire hazard"). |
| **8** | Developing pothole on 4th Main without accident | English | Roads | Medium | Roads / Medium | ✅ | Routine asphalt repair scheduled (72h SLA). Did not over-inflate. |
| **9** | Flickering single streetlight pole #14 | English | Electricity | Medium | Electricity / Medium | ✅ | Streetlight Cell assigned; bulb replacement action suggested. |
| **10** | Clogged storm grate spilling onto sidewalk | English | Drainage | Medium | Drainage / Medium | ✅ | Storm Water Drain Dept assigned; desilting work order generated. |
| **11** | Faded white zebra crossing near library | English | Roads | Low | Roads / Low | ✅ | Routine cosmetic road maintenance; 7-day SLA assigned. |
| **12** | Plastic food wrappers near park bench | English | Waste | Low | Waste / Low | ✅ | Routine sanitation sweeper beat notified; Low severity maintained. |
| **13** | Dirty black tap water making children sick | Hindi | Water | High | Water / High | ✅ | Proximity to children + contaminated water triggered High severity. |
| **14** | Vague input: "something is wrong near my house" | English | Other | Low | Other / Low | ✅ | Confidence scored at 0.20; flagged "Needs human review". |
| **15** | Forced API Failure / No API Key simulation | English/Hindi | Water | High | Water / High | ✅ | Gracefully fell back to `/lib/fallback.ts` with honest "Fallback" badge. |

---

## 3. Prompt & Triage Refinements Made During Testing

1. **Intent Gatekeeper Added**: Messages like "hi", "thanks", "menu", or status inquiries are filtered *before* creating tickets, preventing clutter in municipal databases.
2. **Ambiguity Overrides**: Manholes on roads strictly route to Drainage (Storm Water Drain Dept).
3. **Multimodal Visual Hazard Confirmation**: `image_changed_result` flag confirms visual hazards directly from photo evidence.
4. **Honest Confidence Calibration**: Ambiguous inputs are penalized below 0.60 to trigger officer review.

---

## 4. Role-Based Access Control (RBAC) & Security Verification

| # | Security Test Scenario | Request Method & Endpoint | Expected Result | Actual Result | Status |
|:---:|---|---|---|---|:---:|
| **1** | **Unauthenticated Dashboard Access** | `GET /dashboard` (No session cookie) | 307 Redirect to `/login?redirect=%2Fdashboard` | HTTP 307 Redirect to `/login` | ✅ PASSED |
| **2** | **Unauthenticated Direct API Call (Tickets List)** | `GET /api/tickets` (No session cookie) | `401 Unauthorized` with JSON error | `{"error": "Unauthorized. Officer authentication required to list municipal tickets."}` (HTTP 401) | ✅ PASSED |
| **3** | **Unauthenticated Direct API Call (Stats)** | `GET /api/stats` (No session cookie) | `401 Unauthorized` with JSON error | `{"error": "Unauthorized. Officer authentication required to view municipal statistics."}` (HTTP 401) | ✅ PASSED |
| **4** | **Unauthenticated Direct Mutation (Status/Override)** | `PATCH /api/tickets/CVL-101001` (No session cookie) | `401 Unauthorized` with JSON error | `{"error": "Unauthorized. Officer authentication required to update tickets."}` (HTTP 401) | ✅ PASSED |
| **5** | **Anonymous Citizen Complaint Filing** | `POST /api/tickets` (No session cookie) | HTTP 200/201 Success; ticket created with public tracking ID | Successfully created `#CVL-101016` with zero authentication barrier | ✅ PASSED |
| **6** | **Public Citizen Ticket Privacy Sanitization** | `GET /api/tickets/CVL-101001` (Anonymous citizen) | Only status, category, department, address returned. `audit_trail`, internal notes, and exact coordinates stripped. | Sanitized JSON returned without `audit_trail`, `officer_override`, or exact coordinates | ✅ PASSED |
| **7** | **Officer 1-Click / Credential Authentication** | `POST /api/auth/login` (`ramesh@bbmp.gov.in`) | HTTP 200, signed `httpOnly` JWT session cookie issued | Cookie `civiclens_session` issued; redirected to `/dashboard` | ✅ PASSED |
| **8** | **Officer Action & Named Audit Trail Logging** | `PATCH /api/tickets/CVL-101001` (Logged in as Ramesh Sharma) | Status updated; audit trail records `"Er. Ramesh Sharma"` | Audit event logged with actor `"Er. Ramesh Sharma"` | ✅ PASSED |
| **9** | **Logout Session Revocation** | `POST /api/auth/logout` | Session cookie expired; subsequent `/dashboard` access redirects to `/login` | Cookie cleared; `/dashboard` blocked with 307 redirect | ✅ PASSED |
