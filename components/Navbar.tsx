"use strict";
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Send,
  MessageSquare,
  Lock,
  LogOut,
  UserCheck,
  Building2,
} from "lucide-react";

interface OfficerSessionUser {
  id: string;
  name: string;
  email: string;
  role: "officer";
  department: string;
  title: string;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [officer, setOfficer] = useState<OfficerSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setOfficer(data.user || null);
      } else {
        setOfficer(null);
      }
    } catch {
      setOfficer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setOfficer(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Dynamic Navigation Items
  const navItems = [
    { href: "/", label: "Report Issue", icon: Send },
    { href: "/whatsapp-demo", label: "WhatsApp Intake", icon: MessageSquare, badge: "Simulated" },
    // Dashboard only shown when authenticated as an officer (Requirement 5)
    ...(officer
      ? [{ href: "/dashboard", label: "Command Center", icon: LayoutDashboard }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">CivicLens</span>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                AI Triage
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Municipal Command & Citizen Action</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="hidden md:inline-block rounded bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-medium text-amber-400 border border-amber-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action: Officer Status / Login Button */}
        <div className="flex items-center gap-2.5">
          {!loading && officer ? (
            <div className="flex items-center gap-2">
              {/* Officer Profile Badge */}
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                  {officer.name}
                </span>
                <span className="text-[10px] text-cyan-300 font-mono truncate max-w-[150px]">
                  {officer.department}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Sign out of Officer Portal"
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/40 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            /* Public Citizen View: Show Officer Login */
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <Lock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Officer Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
