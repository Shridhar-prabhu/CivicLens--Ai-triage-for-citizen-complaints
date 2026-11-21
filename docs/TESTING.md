# CivicLens — AI Triage Testing & Prompt Calibration Report

> **Stage 8 Benchmark**: Evaluation of the triage pipeline against 15 edge-case civic complaints.

## 1. 15-Case Benchmark Matrix

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

## 2. Prompt & Triage Refinements Made During Testing

1. **Ambiguity Overrides**:
   - Manhole issues frequently got misclassified under "Roads" because they are on roads. Added explicit override: *"missing manhole covers on roads -> Drainage (Storm Water Drain Dept)"*.
2. **Severity Inflation Control**:
   - Citizens often write with angry capital letters ("VERY BAD SERVICE PLEASE FIX NOW"). Explicitly instructed the model: *"Do not inflate severity just because the writer is angry or uses capital letters."*
3. **Multimodal Visual Hazard Confirmation**:
   - Added `image_changed_result` flag: When a citizen writes a generic complaint but attaches a photo showing an arterial road blocked, the model upgrades severity and explains why in `severity_reason`.
4. **Honest Confidence Calibration**:
   - Inputs lacking location hints or specific defect types are penalized below 0.60 confidence to trigger the "Needs human review" banner on the officer dashboard.
