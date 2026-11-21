import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CivicLens — AI Triage for Citizen Complaints",
  description: "Turn unstructured citizen complaints into structured, prioritised, and correctly routed tickets in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080c14] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <div className="relative min-h-screen flex flex-col">
          {/* Subtle civic glow background */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-transparent blur-3xl opacity-60" />
            <div className="absolute top-1/2 -left-60 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 -right-60 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
          </div>

          <Navbar />
          
          <main className="relative z-10 flex-1">
            {children}
          </main>

          <footer className="relative z-10 border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>CivicLens &bull; AI-Powered Municipal Operations & Triage</p>
              <p className="text-slate-600">Built for Prompt to Product Hackathon &bull; 4-Hour Sprint</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
