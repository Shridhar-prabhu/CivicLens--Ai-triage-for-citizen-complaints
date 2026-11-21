"use strict";
"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Send,
  UploadCloud,
  X,
  Mic,
  MicOff,
  Sparkles,
  AlertCircle,
  MapPin,
  Navigation,
  CheckCircle2,
  Info,
} from "lucide-react";
import { TriageProgressModal } from "./TriageProgressModal";
import { TicketCard } from "./TicketCard";
import type { Ticket, LocationSource } from "@/lib/schema";
import { preFilterIntent } from "@/lib/intent";
import { BENGALURU_CENTER, reverseGeocodeSafe } from "@/lib/geo";

// Dynamic import of Leaflet map with ssr: false (Rule 1 Requirement)
const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-52 w-full rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-xs text-slate-500">
      Loading OpenStreetMap Leaflet Engine...
    </div>
  ),
});

const SAMPLE_COMPLAINTS = [
  {
    label: "English (Critical Wire)",
    tag: "English • Live Wire",
    text: "Electric wire has fallen on the footpath outside Govt Primary School, 5th Cross, Jayanagar. Kids walk here every morning.",
    lat: 12.9250,
    lng: 77.5938,
    address: "5th Cross, Jayanagar, Bengaluru",
  },
  {
    label: "Hindi (High Pothole)",
    tag: "Hindi • Accident",
    text: "सड़क पर बहुत बड़ा गड्ढा है, कल रात एक बाइक वाला गिर गया। अस्पताल रोड, सेक्टर 4।",
    lat: 12.9352,
    lng: 77.6245,
    address: "Hospital Road, Sector 4, HSR Layout, Bengaluru",
  },
  {
    label: "Kannada (Critical Water Burst)",
    tag: "Kannada • Flooding",
    text: "ನಮ್ಮ ಮನೆ ಹತ್ತಿರ ದೊಡ್ಡ ನೀರಿನ ಪೈಪ್ ಒಡೆದು ರಸ್ತೆಯ ತುಂಬ ನೀರು ಹರಿಯುತ್ತಿದೆ, ಬೆಳಿಗ್ಗೆಯಿಂದ ನೀರು ಬರುತ್ತಿಲ್ಲ.",
    lat: 12.9783,
    lng: 77.6408,
    address: "100ft Road, Indiranagar, Bengaluru",
  },
  {
    label: "With Hazard Photo",
    tag: "Multimodal • Fallen Tree",
    text: "Massive tree branch collapsed onto high-voltage power lines and blocked the main intersection near Metro Station.",
    hasSamplePhoto: true,
    lat: 12.9754,
    lng: 77.6066,
    address: "MG Road Metro Station, Bengaluru",
  },
];

const SAMPLE_HAZARD_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export function ComplaintForm() {
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Geospatial state
  const [lat, setLat] = useState<number>(BENGALURU_CENTER.lat);
  const [lng, setLng] = useState<number>(BENGALURU_CENTER.lng);
  const [addressText, setAddressText] = useState("");
  const [locationSource, setLocationSource] = useState<LocationSource>("none");
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

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

  // Browser Geolocation API Handler (Rule 1 Requirement)
  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoNotice("Geolocation is not supported by your browser. You can drag the pin on the map.");
      return;
    }

    setIsLocating(true);
    setGeoNotice("Acquiring GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        setLat(userLat);
        setLng(userLng);
        setLocationSource("gps");
        setGeoNotice("📍 GPS location acquired.");
        setIsLocating(false);

        // Reverse geocode via Nominatim (Safe button-triggered call)
        const addr = await reverseGeocodeSafe(userLat, userLng);
        if (addr) {
          setAddressText(addr);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setGeoNotice("Location permission was denied. You can continue without location or drag the map pin.");
        } else if (err.code === 3) {
          setGeoNotice("Location request timed out. You can continue or drag the pin manually.");
        } else {
          setGeoNotice("Unable to detect GPS. Feel free to drag the pin or type a landmark.");
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleMapPinChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setLocationSource("map_pin");
    setGeoNotice(`📍 Location updated via map pin: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
  };

  // Web Speech API Voice Transcription
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
    setLat(sample.lat);
    setLng(sample.lng);
    setAddressText(sample.address);
    setLocationSource("map_pin");
    setGeoNotice(`Preset location: ${sample.address}`);

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
    const cleanText = text.trim();
    if (!cleanText || cleanText.length < 3) {
      setError("Please describe the issue in at least 3 characters.");
      return;
    }

    // Intent Pre-Filter Check
    const pre = preFilterIntent(cleanText);
    if (pre.isPreFiltered && pre.intent !== "complaint") {
      if (pre.intent === "greeting") {
        setError("Namaste! Please enter an actual civic grievance (e.g. pothole, broken streetlight, garbage, water leak) rather than a greeting.");
      } else if (pre.intent === "status_query") {
        setError("To check ticket status, please visit the Citizen Tracking page (/track/[id]) or use 'status <ID>' on the WhatsApp helpline.");
      } else if (pre.intent === "needs_more_info") {
        setError("Your complaint needs a few more details: please mention the specific problem and the street/area so officers can locate it.");
      } else {
        setError("Please enter a civic issue (roads, water, electricity, waste, drainage, trees). Chit-chat and general queries cannot be triaged as tickets.");
      }
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
          text: cleanText,
          image_base64: imageBase64,
          image_mime: imageMime,
          channel: "web_citizen",
          lat: locationSource !== "none" ? lat : undefined,
          lng: locationSource !== "none" ? lng : undefined,
          address_text: addressText.trim() || undefined,
          location_source: locationSource,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to triage complaint.");
      }

      const data = await res.json();

      if (data.is_ticket === false) {
        setError(data.message || "Message was identified as non-complaint. No ticket created.");
        return;
      }

      setCreatedTicket(data as Ticket);
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
                Click to upload or drag &amp; drop a photo
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

        {/* Location Section (Rule 1 Requirement) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-cyan-400" />
                Incident Location <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pinpoint where the repair crew should be dispatched.
              </p>
            </div>

            {/* Geolocation Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 text-xs font-medium text-cyan-400 transition-colors disabled:opacity-50"
            >
              <Navigation className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
              <span>{isLocating ? "Locating..." : "Use my current location"}</span>
            </button>
          </div>

          {geoNotice && (
            <p className="text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1.5 rounded-xl font-mono">
              {geoNotice}
            </p>
          )}

          {/* Leaflet Draggable Pin Map */}
          <div>
            <MapPicker lat={lat} lng={lng} onChange={handleMapPinChange} />
          </div>

          {/* Address / Landmark text input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Address / Landmark / Street Name
            </label>
            <input
              type="text"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="e.g. 5th Cross, near Govt School, Jayanagar Ward 142"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Privacy Notice */}
          <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
            <span>
              <strong>Privacy guarantee:</strong> We only store coordinates to route municipal repair crews to the exact spot. No personal device identifiers or tracking cookies are ever recorded.
            </span>
          </div>
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
          <span>Triage &amp; Route Complaint Now</span>
        </button>
      </form>

      {/* Triage Progress Animation Modal */}
      <TriageProgressModal isOpen={isSubmitting} />

      {/* Newly Created Ticket Reveal Card */}
      {createdTicket && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ticket Successfully Triaged &amp; Routed to Municipal System:</span>
          </div>
          <TicketCard ticket={createdTicket} />
        </div>
      )}
    </div>
  );
}
