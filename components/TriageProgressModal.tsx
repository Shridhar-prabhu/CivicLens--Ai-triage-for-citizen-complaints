"use strict";
"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles, Languages, FolderTree, AlertTriangle, Send } from "lucide-react";

interface TriageProgressModalProps {
  isOpen: boolean;
  onComplete?: () => void;
}

const STEPS = [
  { label: "Reading citizen unstructured input & photo", icon: Sparkles },
  { label: "Detecting language & translating to English", icon: Languages },
  { label: "Classifying civic category & department mapping", icon: FolderTree },
  { label: "Assessing hazard severity & escalation rubric", icon: AlertTriangle },
  { label: "Routing ticket & calculating priority & SLA", icon: Send },
];

export function TriageProgressModal({ isOpen, onComplete }: TriageProgressModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        if (onComplete) onComplete();
        return prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round(((currentStep + 1) / STEPS.length) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-md shadow-cyan-500/20">
            <Sparkles className="h-5 w-5 text-white animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">CivicLens AI Triage</h3>
            <p className="text-xs text-slate-400">Transforming unstructured report into actionable ticket</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
            <span>Processing Triage Pipeline</span>
            <span className="text-cyan-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step List */}
        <div className="mt-6 space-y-3.5">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 text-xs transition-opacity duration-200 ${
                  isDone
                    ? "text-emerald-400"
                    : isCurrent
                    ? "text-cyan-300 font-medium"
                    : "text-slate-600"
                }`}
              >
                <div className="flex h-6 w-6 items-center justify-center">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 text-slate-600" />
                  )}
                </div>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
