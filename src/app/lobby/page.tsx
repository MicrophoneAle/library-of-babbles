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
        className="group relative block h-52 rounded-b-[2.2rem] border border-amber-100/25 bg-gradient-to-b from-black/35 to-black/75 p-2 transition hover:scale-[1.02]"
      >
        <div className="absolute inset-[10px] rounded-b-[1.8rem] border border-amber-100/15 bg-[radial-gradient(ellipse_at_top,rgba(236,220,178,0.16),rgba(0,0,0,0.5)_56%)]" />
        <div className="absolute inset-x-[24%] bottom-6 h-30 rounded-md border border-amber-200/20 bg-gradient-to-b from-[#5d3a28] to-[#342015] shadow-2xl" />
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
    <section className="relative h-[calc(100vh-57px)] w-full overflow-hidden [perspective:1200px]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e9ddc6] via-[#cdb48f] to-[#8b6444]" />
      <div className="absolute inset-x-0 top-0 h-[58%] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.65),rgba(231,220,194,0.18)_58%,transparent_80%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-t from-[#7d5739] via-[#9d744f] to-transparent" />
      <div className="absolute left-1/2 top-[58%] h-[28rem] w-[98%] -translate-x-1/2 rounded-[50%] border border-[#e5cfaa]/30 bg-[#5d3f2b]/20 [transform:rotateX(69deg)]" />
      <div className="absolute left-1/2 top-[36%] h-[46%] w-[92%] -translate-x-1/2 rounded-[48%] border border-[#f2e5cd]/30 bg-[#a88361]/15" />

      {/* Side shelf walls */}
      <Bookshelf className="absolute left-[-3%] top-[18%] w-80 [transform:rotateY(36deg)_skewY(-3deg)]" compact />
      <Bookshelf className="absolute right-[-3%] top-[18%] w-80 [transform:rotateY(-36deg)_skewY(3deg)]" compact />
      <Bookshelf className="absolute left-[1%] bottom-[10%] w-72 [transform:rotateY(32deg)] opacity-95" compact />
      <Bookshelf className="absolute right-[1%] bottom-[10%] w-72 [transform:rotateY(-32deg)] opacity-95" compact />

      {/* Grand sky window */}
      <div className="absolute left-1/2 top-3 w-[30rem] -translate-x-1/2 opacity-95">
        <WindowLight />
      </div>

      {/* Corridor openings with perspective */}
      <Doorway
        label="ABOUT WING"
        href="/about"
        className="absolute left-[20%] top-[33%] w-60 -translate-x-1/2 [transform:rotateY(18deg)_skewY(-2deg)]"
      />
      <Doorway
        label="PROJECTS WING"
        href="/projects"
        className="absolute left-[80%] top-[33%] w-60 -translate-x-1/2 [transform:rotateY(-18deg)_skewY(2deg)]"
      />
      <Doorway
        label="BLOG ALCOVE"
        href="/blog"
        className="absolute left-[32%] top-[62%] w-52 -translate-x-1/2 [transform:rotateY(10deg)]"
      />
      <Doorway
        label="LIBRARY RECORDS"
        href="/books"
        className="absolute left-[68%] top-[62%] w-52 -translate-x-1/2 [transform:rotateY(-10deg)]"
      />

      {/* Center staircase leading upward */}
      <div className="absolute left-1/2 top-[44%] w-[30rem] -translate-x-1/2">
        <div className="space-y-[4px] [transform:perspective(900px)_rotateX(58deg)]">
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
      <div className="absolute left-1/2 bottom-[14%] z-10 grid w-[46rem] -translate-x-1/2 grid-cols-3 gap-8">
        <ReadingTable className="[transform:rotate(-8deg)]" />
        <ReadingTable className="translate-y-4 [transform:rotate(0deg)]" />
        <ReadingTable className="[transform:rotate(8deg)]" />
      </div>

      {/* Center lectern */}
      <div className="absolute left-1/2 bottom-[6%] z-20 w-[30rem] -translate-x-1/2">
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
