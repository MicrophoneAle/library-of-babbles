export default function WindowLight() {
  return (
    <div className="relative h-72 overflow-hidden rounded-t-[10rem] border border-amber-100/20 bg-gradient-to-b from-amber-100/35 to-transparent">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,220,155,0.7),transparent_60%)]" />
      <div className="absolute -bottom-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-amber-100/20 blur-2xl" />
      <div className="absolute inset-x-1/2 top-14 h-72 w-80 -translate-x-1/2 rotate-[12deg] bg-gradient-to-b from-amber-100/45 to-transparent blur-lg" />
    </div>
  );
}
