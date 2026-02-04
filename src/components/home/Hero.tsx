export default function Hero() {
  return (
    <section className="text-center px-6 pt-26 pb-14">
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-xs font-medium text-primary-500 mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse-dot"></span>
        <span>4 apps available now</span>
      </div>

      <h1 className="text-5xl font-bold tracking-tight text-primary-900 mb-4.5">
        Discover & Play
      </h1>

      <p className="text-lg text-primary-500 max-w-[420px] mx-auto leading-relaxed">
        A curated collection of apps to help you stay productive, have fun, and explore the power of AI.
      </p>
    </section>
  );
}
