import Bookshelf from "@/components/lobby/Bookshelf";
import Lectern from "@/components/lobby/Lectern";
import WindowLight from "@/components/lobby/WindowLight";
import Link from "next/link";

interface DoorwayProps {
  label: string;
  href: string;
  className: string;
}

function Doorway({ label, href, className }: DoorwayProps) {
  return (
    <div className={className}>
      <div className="gold-sign mb-3 rounded border border-amber-200/35 px-3 py-1 text-center text-sm font-semibold tracking-wide text-walnut">
        {label}
      </div>
      <Link
        href={href}
        className="group relative block h-48 rounded-b-[2.2rem] border border-amber-100/25 bg-gradient-to-b from-black/45 to-black/65 p-2 transition hover:scale-[1.02]"
      >
        <div className="absolute inset-[10px] rounded-b-[1.8rem] border border-amber-100/15 bg-black/30" />
        <div className="absolute inset-x-[24%] bottom-6 h-28 rounded-md border border-amber-200/20 bg-gradient-to-b from-[#4c2e20] to-[#2f1d14] shadow-2xl" />
        <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/45 bg-gradient-to-br from-amber-100 to-amber-500/80 shadow-glow" />
        <span className="absolute inset-x-0 bottom-2 text-center text-xs uppercase tracking-[0.2em] text-amber-100/80">
          Enter
        </span>
      </Link>
    </div>
  );
}

function ReadingTable({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-12 rounded-md border border-[#c8ad7f]/55 bg-[#9e754f]/65 shadow-xl ${className}`}>
      <div className="absolute inset-x-3 top-2 h-2 rounded bg-[#d6bb8c]/65" />
      <div className="absolute left-5 top-8 h-8 w-2 rounded bg-[#7b573b]" />
      <div className="absolute right-5 top-8 h-8 w-2 rounded bg-[#7b573b]" />
    </div>
  );
}

export default function LobbyPage() {
  return (
    <section className="relative h-[calc(100vh-57px)] w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e9ddc6] via-[#cdb48f] to-[#8b6444]" />
      <div className="absolute inset-x-0 top-0 h-[58%] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.65),rgba(231,220,194,0.18)_58%,transparent_80%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-t from-[#7d5739] via-[#9d744f] to-transparent" />
      <div className="absolute left-1/2 top-[53%] h-[22rem] w-[92%] -translate-x-1/2 rounded-[50%] border border-[#e5cfaa]/30 bg-[#5d3f2b]/25" />
      <div className="absolute left-1/2 top-[37%] h-[42%] w-[88%] -translate-x-1/2 rounded-[45%] border border-[#f2e5cd]/25 bg-[#a88361]/20" />

      {/* Side shelf walls */}
      <Bookshelf className="absolute left-5 top-12 w-72" compact />
      <Bookshelf className="absolute right-5 top-12 w-72" compact />
      <Bookshelf className="absolute left-10 bottom-16 w-64" compact />
      <Bookshelf className="absolute right-10 bottom-16 w-64" compact />

      {/* Grand sky window */}
      <div className="absolute left-1/2 top-3 w-[30rem] -translate-x-1/2 opacity-95">
        <WindowLight />
      </div>

      {/* Upper doorways */}
      <Doorway label="ABOUT WING" href="/about" className="absolute left-[24%] top-[30%] w-64 -translate-x-1/2" />
      <Doorway label="PROJECTS WING" href="/projects" className="absolute left-[76%] top-[30%] w-64 -translate-x-1/2" />

      {/* Lower doorways */}
      <Doorway label="BLOG ALCOVE" href="/blog" className="absolute left-[27%] top-[61%] w-60 -translate-x-1/2" />
      <Doorway label="LIBRARY RECORDS" href="/books" className="absolute left-[73%] top-[61%] w-60 -translate-x-1/2" />

      {/* Center staircase leading upward */}
      <div className="absolute left-1/2 top-[46%] w-[28rem] -translate-x-1/2">
        <div className="space-y-[5px]">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="mx-auto h-3 rounded border border-[#ecd8b7]/35 bg-[#7a5437]"
              style={{ width: `${100 - idx * 8}%` }}
            />
          ))}
        </div>
      </div>

      {/* Furniture cluster */}
      <div className="absolute left-1/2 bottom-[15%] z-10 grid w-[42rem] -translate-x-1/2 grid-cols-3 gap-5">
        <ReadingTable />
        <ReadingTable className="translate-y-4" />
        <ReadingTable />
      </div>

      {/* Center lectern */}
      <div className="absolute left-1/2 bottom-[11%] z-20 w-[30rem] -translate-x-1/2">
        <Lectern />
      </div>

      {/* Under-construction marker for higher floors */}
      <div className="absolute left-1/2 top-[43%] z-20 w-[25rem] -translate-x-1/2">
        <div className="rounded-md border border-yellow-600/55 bg-yellow-100/75 px-4 py-2 text-center text-sm font-semibold tracking-wide text-yellow-900 shadow-lg">
          CAUTION - UPPER FLOOR UNDER CONSTRUCTION
        </div>
      </div>
    </section>
  );
}
