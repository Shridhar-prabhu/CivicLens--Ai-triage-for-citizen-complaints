import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, IMAGE_PROMPT_INSTRUCTION } from "@/lib/prompts";
import { fallbackTriage } from "@/lib/fallback";
import { preFilterIntent } from "@/lib/intent";
import { TriageResultSchema, type TriageResult } from "@/lib/schema";

interface TriageRequestBody {
  text: string;
  image_base64?: string;
  image_mime?: string;
}

/**
 * Call Gemini 1.5 Flash API with strict JSON mode
 */
async function callGemini(
  text: string,
  imageBase64?: string,
  imageMime?: string,
  apiKey?: string
): Promise<string> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  let userPrompt = text.trim();
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (imageBase64 && imageMime) {
    userPrompt = `${userPrompt}\n\n${IMAGE_PROMPT_INSTRUCTION}`;
    parts.push({ text: userPrompt });
    parts.push({
      inlineData: {
        mimeType: imageMime,
        data: imageBase64,
      },
    });
  } else {
    parts.push({ text: userPrompt });
  }

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  };

  // 12-second abort timeout to prevent hanging requests during live demos
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      throw new Error("Empty response received from Gemini API.");
    }

    return rawContent;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function POST(req: NextRequest) {
  let body: TriageRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const rawText = body.text?.trim();
  if (!rawText || rawText.length < 2) {
    return NextResponse.json({ error: "Complaint text is required (min 2 characters)" }, { status: 400 });
  }

  // 1. Rule-Based Intent Pre-Filter (Runs before AI call)
  const pre = preFilterIntent(rawText);
  if (pre.isPreFiltered && pre.intent !== "complaint") {
    return NextResponse.json({
      intent: pre.intent,
      category: "Other",
      severity: "Low",
      severity_reason: `Input detected as ${pre.intent}.`,
      department: "Ward Office",
      summary: rawText.slice(0, 80),
      detected_language: "English",
      translated_text: rawText,
      location_hint: "",
      confidence: 0.98,
      suggested_action: pre.botReply || "Respond without creating a ticket.",
      urgency_signals: [],
      source: "fallback",
      is_ticket: false,
      bot_reply: pre.botReply,
      extracted_ticket_id: pre.extractedTicketId,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // If no API key is provided, gracefully invoke fallback immediately
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.warn("[CivicLens Triage] GEMINI_API_KEY not configured. Engaging keyword fallback engine.");
    const fallbackResult = fallbackTriage(rawText);
    return NextResponse.json({
      ...fallbackResult,
      source: "fallback",
      needs_human_review: fallbackResult.confidence < 0.6,
      fallback_reason: "API key not configured in environment.",
    });
  }

  // Attempt 1 with Gemini API
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < 2) {
    attempts++;
    try {
      const rawJson = await callGemini(rawText, body.image_base64, body.image_mime, apiKey);
      const parsed = JSON.parse(rawJson);

      // Validate against strict Zod schema
      const validated = TriageResultSchema.parse({
        ...parsed,
        source: "ai",
        image_changed_result: parsed.image_changed_result === true,
      });

      return NextResponse.json({
        ...validated,
        source: "ai",
        needs_human_review: validated.confidence < 0.6,
      });
    } catch (err: any) {
      lastError = err;
      console.warn(`[CivicLens Triage] Attempt ${attempts} failed:`, err.message);
      // Brief pause before retry attempt 2
      if (attempts < 2) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  // If both attempts fail, smoothly switch to the deterministic multilingual fallback
  console.warn("[CivicLens Triage] Gemini attempts failed. Engaging keyword fallback engine:", lastError?.message);
  const fallbackResult = fallbackTriage(rawText);

  return NextResponse.json({
    ...fallbackResult,
    source: "fallback",
    needs_human_review: fallbackResult.confidence < 0.6,
    fallback_reason: lastError?.message || "AI triage timed out or returned invalid format.",
  });
}
