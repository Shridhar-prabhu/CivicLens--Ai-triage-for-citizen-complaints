import type { Category, Severity, TriageResult } from "./schema";
import { preFilterIntent } from "./intent";

export const DEPARTMENTS: Record<Category, string> = {
  Roads: "Roads & Infrastructure",
  Waste: "Solid Waste Management",
  Water: "Water Supply & Sewerage Board",
  Electricity: "Electricity Dept / Streetlight Cell",
  Trees: "Horticulture / Forest Cell",
  Drainage: "Storm Water Drain Dept",
  Other: "Ward Office",
};

const CATEGORY_KEYWORDS: Record<Exclude<Category, "Other">, string[]> = {
  Roads: [
    "pothole", "road", "footpath", "crack", "speed breaker", "signboard",
    "गड्ढा", "सड़क", "रोड", "फुटपाथ", "gaddha", "sadak",
    "ಗುಂಡಿ", "ರಸ್ತೆ", "ಫುಟ್ಪಾತ್", "gundi", "rasthe"
  ],
  Waste: [
    "garbage", "trash", "waste", "litter", "dump", "dustbin", "smell", "dead animal",
    "कचरा", "गंदगी", "कूड़ा", "बदबू", "kachra", "kooda", "gandagi",
    "ಕಸ", "ಕಸದ", "ದುರ್ವಾಸನೆ", "kasa"
  ],
  Water: [
    "water", "leak", "pipe", "supply", "tap", "contaminated", "borewell", "main burst",
    "पानी", "पाइप", "लीक", "नल", "सप्लाई", "paani", "pipe fat",
    "ನೀರು", "ಪೈಪ್", "ಸೋರಿಕೆ", "ನಲ್ಲಿ", "neeru"
  ],
  Electricity: [
    "wire", "electric", "streetlight", "street light", "light", "transformer", "spark",
    "current", "shock", "pole", "power",
    "बिजली", "तार", "करंट", "स्ट्रीट लाइट", "बत्ती", "खंभा", "bijli", "taar",
    "ವಿದ್ಯುತ್", "ತಂತಿ", "ಬೀದಿ ದೀಪ", "ಕಂಬ", "ಟ್ರಾನ್ಸ್ಫಾರ್ಮರ್", "vidyut"
  ],
  Trees: [
    "tree", "branch", "fallen tree", "uprooted", "trunk",
    "पेड़", "पेड", "डाली", "शाखा", "ped",
    "ಮರ", "ಟೊಂಗೆ", "ಕೊಂಬೆ", "mara"
  ],
  Drainage: [
    "drain", "sewage", "sewer", "manhole", "waterlogging", "clogged", "overflow", "gutter",
    "नाली", "नाला", "जलभराव", "मैनहोल", "सीवर", "naali", "nala",
    "ಚರಂಡಿ", "ಮ್ಯಾನ್ಹೋಲ್", "ಒಳಚರಂಡಿ", "charandi"
  ],
};

const CRITICAL_WORDS = [
  "live wire", "fallen wire", "wire fallen", "exposed wire", "sparking", "sparks",
  "electrocut", "open manhole", "manhole open", "gas leak", "main burst", "pipe burst", "tree fell", "fell on",
  "करंट", "खुला मैनहोल", "तार गिर", "चिंगारी", "पाइप फट",
  "ತಂತಿ ಬಿದ್ದ", "ಕಿಡಿ", "ತೆರೆದ ಮ್ಯಾನ್ಹೋಲ್", "ಪೈಪ್ ಒಡೆ"
];

const SENSITIVE_WORDS = [
  "school", "hospital", "college", "bus stop", "market", "temple", "children", "kids", "elderly",
  "स्कूल", "अस्पताल", "बच्चे", "मंदिर", "बाज़ार", "बाजार",
  "ಶಾಲೆ", "ಆಸ್ಪತ್ರೆ", "ಮಕ್ಕಳು", "ದೇವಸ್ಥಾನ", "ಮಾರುಕಟ್ಟೆ"
];

const URGENCY_WORDS = [
  "accident", "injured", "fell", "danger", "dangerous", "many days", "whole street", "overflowing",
  "दुर्घटना", "घायल", "खतरा", "गिर गया", "कई दिन",
  "ಅಪಘಾತ", "ಗಾಯ", "ಅಪಾಯ", "ಬಿದ್ದ", "ಹಲವು ದಿನ"
];

const LEVELS: Severity[] = ["Low", "Medium", "High", "Critical"];
const bump = (s: Severity): Severity => LEVELS[Math.min(LEVELS.indexOf(s) + 1, 3)];
const count = (text: string, words: string[]) => words.filter((w) => text.includes(w.toLowerCase())).length;
const hits = (text: string, words: string[]) => words.filter((w) => text.includes(w.toLowerCase()));

function detectLanguage(text: string): string {
  if (/[\u0C80-\u0CFF]/.test(text)) return "Kannada";
  if (/[\u0900-\u097F]/.test(text)) return "Hindi";
  return "English (or romanised)";
}

export function fallbackTriage(rawText: string): TriageResult {
  const text = rawText.toLowerCase();

  // 1. Category = highest keyword score
  let best: Category = "Other";
  let bestScore = 0;
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS) as [Exclude<Category, "Other">, string[]][]) {
    const score = count(text, words);
    if (score > bestScore) {
      best = cat;
      bestScore = score;
    }
  }

  // Ambiguity overrides
  if (count(text, ["manhole", "मैनहोल", "ಮ್ಯಾನ್ಹೋಲ್"]) && best === "Roads") best = "Drainage";
  if (count(text, ["wire", "तार", "ತಂತಿ"]) && best !== "Electricity") best = "Electricity";

  // 2. Severity
  let severity: Severity = best === "Other" ? "Low" : "Medium";
  const signals = [...hits(text, CRITICAL_WORDS), ...hits(text, URGENCY_WORDS), ...hits(text, SENSITIVE_WORDS)];
  let reason = "Routine issue by keyword match; needs a timely fix.";

  if (count(text, URGENCY_WORDS)) {
    severity = "High";
    reason = "Urgency words found (accident, danger or prolonged issue).";
  }

  if (count(text, SENSITIVE_WORDS) && best !== "Other") {
    severity = bump(severity);
    reason = "Near a sensitive or crowded place (school, hospital or similar), so severity is raised.";
  }

  if (count(text, CRITICAL_WORDS)) {
    severity = "Critical";
    reason = "Immediate safety hazard keywords found (live wire, open manhole, main burst or similar).";
  }

  // Intent pre-check
  const pre = preFilterIntent(rawText);
  const intent = pre.intent;

  if (intent !== "complaint") {
    return {
      intent,
      category: "Other",
      severity: "Low",
      severity_reason: `Non-complaint input classified as ${intent}.`,
      department: DEPARTMENTS.Other,
      summary: rawText.trim().slice(0, 100),
      detected_language: detectLanguage(rawText),
      translated_text: rawText,
      location_hint: "",
      confidence: 0.95,
      suggested_action: pre.botReply || "Acknowledge message without creating a complaint ticket.",
      urgency_signals: [],
      image_changed_result: false,
      source: "fallback",
    };
  }

  // 3. Low confidence on purpose: keyword matching is not semantic understanding
  const confidence = best === "Other" ? 0.2 : Math.min(0.4 + bestScore * 0.1, 0.65);

  return {
    intent: "complaint",
    category: best,
    severity,
    severity_reason: reason,
    department: DEPARTMENTS[best],
    summary: rawText.trim().slice(0, 100),
    detected_language: detectLanguage(rawText),
    translated_text: rawText, // fallback cannot translate; UI shows "Translation unavailable"
    location_hint: "",
    confidence,
    suggested_action: "Verify on site; this ticket was triaged by the keyword fallback.",
    urgency_signals: Array.from(new Set(signals)),
    image_changed_result: false,
    source: "fallback",
  };
}
