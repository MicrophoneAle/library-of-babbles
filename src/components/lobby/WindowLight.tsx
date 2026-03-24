export default function WindowLight() {
  return (
    <div className="relative h-80 overflow-hidden rounded-[999px] border-4 border-[#d3b982]/60 bg-gradient-to-b from-slate-100 via-[#e6ecf7] to-[#d9e2f0] shadow-[0_0_60px_rgba(255,239,188,0.35)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.9),rgba(217,226,240,0.2)_60%,transparent_75%)]" />
      <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[#c9b07a]/70" />
      <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-[#c9b07a]/70" />
      <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9b07a]/45" />
      <div className="absolute -bottom-14 left-1/2 h-44 w-72 -translate-x-1/2 rounded-full bg-amber-100/35 blur-2xl" />
    </div>
  );
}
