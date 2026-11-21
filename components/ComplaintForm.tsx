"use strict";
"use client";

import React, { useState, useRef } from "react";
import { Send, UploadCloud, X, Mic, MicOff, Sparkles, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { TriageProgressModal } from "./TriageProgressModal";
import { TicketCard } from "./TicketCard";
import type { Ticket } from "@/lib/schema";

// Pre-packaged test scenarios matching Section 7 requirements
const SAMPLE_COMPLAINTS = [
  {
    label: "English (Critical Wire)",
    tag: "English • Live Wire",
    text: "Electric wire has fallen on the footpath outside Govt Primary School, 5th Cross, Jayanagar. Kids walk here every morning.",
  },
  {
    label: "Hindi (High Pothole)",
    tag: "Hindi • Accident",
    text: "सड़क पर बहुत बड़ा गड्ढा है, कल रात एक बाइक वाला गिर गया। अस्पताल रोड, सेक्टर 4।",
  },
  {
    label: "Kannada (Critical Water Burst)",
    tag: "Kannada • Flooding",
    text: "ನಮ್ಮ ಮನೆ ಹತ್ತಿರ ದೊಡ್ಡ ನೀರಿನ ಪೈಪ್ ಒಡೆದು ರಸ್ತೆಯ ತುಂಬ ನೀರು ಹರಿಯುತ್ತಿದೆ, ಬೆಳಿಗ್ಗೆಯಿಂದ ನೀರು ಬರುತ್ತಿಲ್ಲ.",
  },
  {
    label: "With Hazard Photo",
    tag: "Multimodal • Fallen Tree",
    text: "Massive tree branch collapsed onto high-voltage power lines and blocked the main intersection near Metro Station.",
    hasSamplePhoto: true,
  },
];

// Placeholder 1x1 transparent PNG data url or real SVG data url for sample hazard photo
const SAMPLE_HAZARD_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export function ComplaintForm() {
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload Handlers
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WebP).");
      return;
    }
    setError(null);
    setImageMime(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      const base64Data = result.split(",")[1];
      setImageBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setImageBase64(null);
    setImageMime(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Web Speech API Voice Transcription (Progressive Enhancement)
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your complaint.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Sample Preset Loader
  const loadPreset = (sample: typeof SAMPLE_COMPLAINTS[0]) => {
    setText(sample.text);
    setError(null);
    setCreatedTicket(null);
    if (sample.hasSamplePhoto) {
      setImageBase64(SAMPLE_HAZARD_BASE64);
      setImageMime("image/png");
      setImagePreview("data:image/png;base64," + SAMPLE_HAZARD_BASE64);
    } else {
      removeImage();
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 3) {
      setError("Please describe the issue in at least 3 characters.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setCreatedTicket(null);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          image_base64: imageBase64,
          image_mime: imageMime,
          channel: "web_citizen",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to triage complaint.");
      }

      const ticket: Ticket = await res.json();
      setCreatedTicket(ticket);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while triaging.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Sample presets bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            Try a Real-World Sample Complaint:
          </span>
          <span className="text-[11px] text-slate-500 font-mono">1-Click Live Test</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_COMPLAINTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(sample)}
              className="text-left rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 hover:border-cyan-500/40 hover:bg-slate-900 transition-all text-xs group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                {sample.label}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{sample.tag}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Intake Form */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="complaint-text" className="text-sm font-semibold text-white">
              Describe the Civic Complaint
            </label>
            <div className="flex items-center gap-2">
              {/* Web Speech Dictation */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                  isListening
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800"
                }`}
                title="Dictate in English or regional speech"
              >
                {isListening ? <MicOff className="h-3 w-3 text-rose-400" /> : <Mic className="h-3 w-3 text-cyan-400" />}
                <span>{isListening ? "Listening..." : "Voice Input"}</span>
              </button>
              <span className="text-xs text-slate-500 font-mono">{text.length} chars</span>
            </div>
          </div>

          <textarea
            id="complaint-text"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type in English, Hindi, Kannada, or mixed text... e.g. 'Huge pothole on Ring Road near Hospital causing bike accidents' or 'ವಿದ್ಯುತ್ ತಂತಿ ಕೆಳಗೆ ಬಿದ್ದಿದೆ...'"
            className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 p-4 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none transition-all"
          />
        </div>

        {/* Drag-and-Drop Image Uploader */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Attach Hazard Photo <span className="text-xs font-normal text-slate-400">(Optional)</span>
          </label>

          {imagePreview ? (
            <div className="relative rounded-2xl border border-slate-700/80 bg-slate-950/60 p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={imagePreview}
                  alt="Complaint Preview"
                  className="h-16 w-16 rounded-xl object-cover border border-slate-700"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Hazard photo attached</p>
                  <p className="text-[11px] text-cyan-400 font-mono">Will be analyzed by Gemini Vision</p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="rounded-lg p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-6 text-center hover:border-cyan-500/50 hover:bg-slate-900/40 cursor-pointer transition-all"
            >
              <UploadCloud className="h-8 w-8 text-cyan-400 mb-2 opacity-80" />
              <p className="text-xs font-semibold text-slate-300">
                Click to upload or drag & drop a photo
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Visual analysis verifies severity and detects hidden hazards
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !text.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3.5 px-6 font-semibold text-sm text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send className="h-4 w-4" />
          <span>Triage & Route Complaint Now</span>
        </button>
      </form>

      {/* Triage Progress Animation Modal */}
      <TriageProgressModal isOpen={isSubmitting} />

      {/* Newly Created Ticket Reveal Card */}
      {createdTicket && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ticket Successfully Triaged & Routed to Municipal System:</span>
          </div>
          <TicketCard ticket={createdTicket} />
        </div>
      )}
    </div>
  );
}
