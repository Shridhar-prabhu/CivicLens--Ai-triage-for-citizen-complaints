import Link from "next/link";
import { ComplaintForm } from "@/components/ComplaintForm";
import { ArrowRight, ShieldCheck, Zap, Globe2, Activity } from "lucide-react";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300">
          <Zap className="h-3.5 w-3.5 text-cyan-400" />
          <span>Autonomous Municipal Triage</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          From complaint to action in{" "}
          <span className="text-gradient-civic">seconds.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          AI triage for citizen reports: multilingual text, hazard photo inspection,
          strict severity classification, and instant routing to city departments.
        </p>

        {/* Value Props Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
            <Globe2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>English, Hindi & Kannada</span>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Gemini Multimodal Vision</span>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
            <Activity className="h-3.5 w-3.5 text-indigo-400" />
            <span>Real-time SLA Dispatch</span>
          </span>
        </div>
      </section>

      {/* Main Form Intake Section */}
      <section>
        <ComplaintForm />
      </section>

      {/* Quick Jump to Officer Dashboard */}
      <section className="text-center pt-4">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <span className="text-xs text-slate-400">Are you a municipal ward officer?</span>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>Open Command Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
