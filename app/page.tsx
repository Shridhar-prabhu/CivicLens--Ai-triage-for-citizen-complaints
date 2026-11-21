export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300">
          CivicLens AI Triage Engine
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          From complaint to action in{" "}
          <span className="text-gradient-civic">seconds.</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-400">
          Empowering citizens and municipal officers with real-time multilingual triage,
          intelligent multimodal severity assessment, and automated department dispatch.
        </p>
      </div>
    </div>
  );
}
