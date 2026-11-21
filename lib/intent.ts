import type { Category } from "./schema";

export type Intent =
  | "complaint"
  | "greeting"
  | "status_query"
  | "help"
  | "chitchat_or_non_civic"
  | "needs_more_info";

const GREETINGS = [
  "hi",
  "hello",
  "hey",
  "namaste",
  "namaskar",
  "namaskara",
  "नमस्ते",
  "नमस्कार",
  "ನಮಸ್ಕಾರ",
  "good morning",
  "good evening",
  "good afternoon",
  "sup",
  "yo",
  "helo",
];

const HELP_WORDS = [
  "help",
  "menu",
  "?",
  "how to use",
  "what can you do",
  "options",
  "commands",
  "madad",
  "मदद",
  "ಸಹಾಯ",
];

const CHITCHAT_WORDS = [
  "thanks",
  "thank you",
  "thx",
  "ok",
  "okay",
  "k",
  "bye",
  "goodbye",
  "cool",
  "great",
  "awesome",
  "dhanyawad",
  "dhanyavad",
  "धन्यवाद",
  "ಧನ್ಯವಾದಗಳು",
  "nice",
  "good",
  "yes",
  "no",
];

const CIVIC_KEYWORDS = [
  "pothole", "road", "footpath", "garbage", "trash", "waste", "dump", "smell",
  "water", "leak", "pipe", "wire", "electric", "streetlight", "light", "spark",
  "tree", "branch", "drain", "sewage", "sewer", "manhole", "waterlogging",
  "गड्ढा", "सड़क", "कचरा", "गंदगी", "पानी", "पाइप", "बिजली", "तार", "पेड़", "नाली", "मैनहोल",
  "ಗುಂಡಿ", "ರಸ್ತೆ", "ಕಸ", "ನೀರು", "ಪೈಪ್", "ವಿದ್ಯುತ್", "ತಂತಿ", "ಮರ", "ಚರಂಡಿ",
];

// Regex matching ticket IDs like CVL-101001, CL-1042, etc.
const TICKET_ID_REGEX = /\b(CVL-\d+|CL-\d+|\d{6})\b/i;

/**
 * Fast Rule-Based Intent Pre-Filter
 * Runs synchronously before any AI call: saves API costs, reduces latency to 1ms,
 * and functions 100% offline.
 */
export function preFilterIntent(rawText: string): {
  intent: Intent;
  extractedTicketId?: string;
  isPreFiltered: boolean;
  botReply?: string;
} {
  const text = rawText.trim().toLowerCase();
  const cleanPunctuation = text.replace(/[!?,.]/g, "").trim();

  // 1. Emoji-only or empty check
  if (!text || /^[\p{Emoji}\s]+$/u.test(text)) {
    return {
      intent: "chitchat_or_non_civic",
      isPreFiltered: true,
      botReply: "I am the CivicLens municipal assistant. Please describe a civic issue (roads, garbage, water, electricity, drainage, or fallen trees) to file a ticket.",
    };
  }

  // 2. Greetings
  if (GREETINGS.includes(cleanPunctuation) || GREETINGS.some((g) => text === g)) {
    return {
      intent: "greeting",
      isPreFiltered: true,
      botReply:
        "Namaste! Welcome to Bangalore Municipal Corporation Civic Helpline.\n\n" +
        "• To report an issue: Describe what happened, where, and attach an optional photo.\n" +
        "• To track a ticket: Type 'status <TicketID>' (e.g. 'status CVL-101001').\n" +
        "• For help: Type 'help'.",
    };
  }

  // 3. Help
  if (HELP_WORDS.includes(cleanPunctuation)) {
    return {
      intent: "help",
      isPreFiltered: true,
      botReply:
        "🤖 *CivicLens Bot Capabilities:*\n\n" +
        "1. *File Complaints*: Potholes, broken streetlights, water leaks, garbage dumps, fallen trees, overflowing drains.\n" +
        "2. *Languages*: English, Hindi, Kannada, or mixed conversational text.\n" +
        "3. *Track Status*: Type 'status <TicketID>' to check real-time resolution timeline.\n" +
        "4. *Emergency SLA*: Critical life hazards (live wires, open manholes) receive 2-hour emergency escalation.",
    };
  }

  // 4. Status queries (e.g. "status CVL-101001", "track CL-1042", "where is my ticket?")
  const idMatch = rawText.match(TICKET_ID_REGEX);
  if (text.startsWith("status") || text.startsWith("track") || text.includes("where is my ticket") || (idMatch && (text.includes("ticket") || text.length < 15))) {
    const extractedId = idMatch ? idMatch[0].toUpperCase() : undefined;
    return {
      intent: "status_query",
      extractedTicketId: extractedId,
      isPreFiltered: true,
    };
  }

  // 5. Chitchat / Pleasantries
  if (CHITCHAT_WORDS.includes(cleanPunctuation)) {
    return {
      intent: "chitchat_or_non_civic",
      isPreFiltered: true,
      botReply: "You're welcome! Please reach out whenever you encounter a civic issue in your neighborhood. Have a great day!",
    };
  }

  // 6. Messages shorter than 4 words with no civic keywords -> needs_more_info
  const words = cleanPunctuation.split(/\s+/).filter((w) => w.length > 0);
  const hasCivicKeyword = CIVIC_KEYWORDS.some((kw) => text.includes(kw));

  if (words.length < 4 && !hasCivicKeyword) {
    return {
      intent: "needs_more_info",
      isPreFiltered: true,
      botReply: "Could you provide a few more details? Which street, ward or landmark is this, and what is the exact civic issue?",
    };
  }

  // Fallthrough: Let AI or Fallback determine if it's a complaint
  return {
    intent: "complaint",
    isPreFiltered: false,
  };
}
