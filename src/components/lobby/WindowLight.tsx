export default function WindowLight() {
  return (
    <div className="relative h-28 overflow-hidden rounded-t-[999px] border-4 border-b-0 border-[#d3b982]/65 bg-gradient-to-b from-slate-100 via-[#e6ecf7] to-[#d9e2f0] shadow-[0_0_40px_rgba(255,239,188,0.25)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_10%,rgba(255,255,255,0.95),rgba(217,226,240,0.3)_62%,transparent_85%)]" />
      <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[#c9b07a]/70" />
      <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-[#c9b07a]/70" />
      <div className="absolute left-1/2 top-[56%] h-28 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9b07a]/40" />
      <div className="absolute -bottom-8 left-1/2 h-24 w-64 -translate-x-1/2 rounded-full bg-amber-100/25 blur-2xl" />
    </div>
  );
}
