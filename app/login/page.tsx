"use strict";
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  UserCheck,
  Building2,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { DEMO_OFFICERS } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeOfficerId, setActiveOfficerId] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          router.push(redirectPath);
        }
      })
      .catch(() => {});
  }, [redirectPath, router]);

  // One-click demo sign-in
  const handleQuickLogin = async (officerId: string) => {
    setError(null);
    setLoading(true);
    setActiveOfficerId(officerId);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officer_id: officerId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Successful login
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Authentication error occurred");
    } finally {
      setLoading(false);
      setActiveOfficerId(null);
    }
  };

  // Standard email/password submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials");
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">CivicLens</span>
        </Link>

        <h2 className="text-xl font-bold tracking-tight text-white">
          Municipal Officer Authentication
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Sign in to access the Command Dashboard, triage overrides, and dispatch field units.
        </p>

        {/* Honest Prototype Notice (Requirement 1) */}
        <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-left">
          <div className="flex items-start gap-2.5">
            <Lock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              <strong>Notice:</strong> Demo login for the hackathon prototype. Production would use the corporation's SSO.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Demo Accounts (Fast Jury Evaluation) */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                One-Click Demo Officer Sign-In
              </h3>
              <p className="text-[11px] text-slate-400">Pre-seeded municipal department accounts for quick testing</p>
            </div>
            <span className="text-[10px] font-mono text-slate-500">1-Click</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEMO_OFFICERS.map((officer) => (
              <button
                key={officer.id}
                type="button"
                onClick={() => handleQuickLogin(officer.id)}
                disabled={loading}
                className={`p-3 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                  activeOfficerId === officer.id
                    ? "bg-cyan-500/20 border-cyan-500/50 shadow-md shadow-cyan-500/20"
                    : "bg-slate-900/60 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                      {officer.name}
                    </span>
                    <UserCheck className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{officer.title}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-cyan-400 truncate max-w-[140px] font-medium">
                    {officer.department}
                  </span>
                  <span className="text-slate-500 group-hover:text-slate-300">&rarr;</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Standard Email / Password Form */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              Manual Credential Sign-In
            </h3>
            <span className="text-[10px] text-slate-500">Demo PW: officer123</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Official Municipal Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@bbmp.gov.in"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-400 font-medium">Password</label>
                <span className="text-[10px] text-slate-500">SHA-256 Hashed</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-2.5 px-4 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Officer Portal"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Public Citizen Grievance Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex flex-col items-center justify-center text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-3" />
          <p className="text-xs">Loading officer authentication portal...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
