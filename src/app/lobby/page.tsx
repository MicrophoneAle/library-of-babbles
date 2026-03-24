import Bookshelf from "@/components/lobby/Bookshelf";
import Lectern from "@/components/lobby/Lectern";
import WindowLight from "@/components/lobby/WindowLight";
import Link from "next/link";

interface DoorwayProps {
  label: string;
  href: string;
  className: string;
}

function Archway({ label, href, className }: DoorwayProps) {
  return (
    <div className={className}>
      <div className="gold-sign mb-3 rounded border border-amber-200/35 px-3 py-1 text-center text-xs font-semibold tracking-[0.16em] text-walnut">
        {label}
      </div>
      <Link
        href={href}
        className="group relative block h-64 w-full overflow-hidden rounded-t-[999px] border border-[#ead9ba]/40 bg-gradient-to-b from-[#312015] to-[#1c110d] p-2 transition hover:scale-[1.02]"
      >
        <div className="absolute inset-[8px] rounded-t-[999px] border border-[#f1e5cf]/20 bg-[radial-gradient(ellipse_at_top,rgba(248,236,205,0.2),rgba(0,0,0,0.55)_62%)]" />
        {/* View into neighboring room */}
        <div className="absolute inset-x-6 bottom-8 top-16 rounded-t-[999px] border border-[#f1e5cf]/15 bg-gradient-to-b from-[#8a6c47]/45 to-[#2d1d13]">
          <div className="absolute inset-x-4 top-3 h-20 rounded-t-[999px] border border-[#ead5ad]/25 bg-[#d4c09a]/20" />
          <div className="absolute inset-x-6 bottom-4 h-14 rounded bg-[#5b3f2e]/55" />
          <div className="absolute bottom-4 left-8 h-12 w-3 rounded bg-[#6f533c]/60" />
          <div className="absolute bottom-4 right-8 h-12 w-3 rounded bg-[#6f533c]/60" />
        </div>
        <span className="absolute inset-x-0 bottom-2 text-center text-xs uppercase tracking-[0.16em] text-amber-100/85">
          Explore
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#e6dcc7] via-[#cfba98] to-[#8a6548]" />
      <div className="absolute inset-x-0 top-0 h-[50%] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.65),rgba(231,220,194,0.24)_55%,transparent_80%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-[#4b2f21] via-[#6f4b35] to-transparent" />
      <div className="absolute left-1/2 top-[58%] h-[30rem] w-[105%] -translate-x-1/2 rounded-[50%] border border-[#e5cfaa]/20 bg-[#2e1d15]/35 [transform:rotateX(71deg)]" />

      {/* Side shelf walls */}
      <Bookshelf className="absolute left-[-2%] top-[18%] w-80 [transform:rotateY(30deg)_skewY(-2deg)]" compact />
      <Bookshelf className="absolute right-[-2%] top-[18%] w-80 [transform:rotateY(-30deg)_skewY(2deg)]" compact />
      <Bookshelf className="absolute left-[2%] bottom-[12%] w-72 [transform:rotateY(26deg)] opacity-95" compact />
      <Bookshelf className="absolute right-[2%] bottom-[12%] w-72 [transform:rotateY(-26deg)] opacity-95" compact />

      {/* Flattened top skylight */}
      <div className="absolute left-1/2 top-0 w-[24rem] -translate-x-1/2 opacity-95">
        <WindowLight />
      </div>

      {/* Two arched section openings only */}
      <Archway
        label="PROJECTS WING"
        href="/projects"
        className="absolute left-[27%] top-[30%] w-44 -translate-x-1/2 [transform:rotateY(12deg)]"
      />
      <Archway
        label="BLOG ALCOVE"
        href="/blog"
        className="absolute left-[73%] top-[30%] w-44 -translate-x-1/2 [transform:rotateY(-12deg)]"
      />

      {/* Dark wood tiled floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[34%] border-t border-[#e7d3ad]/20"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(24,14,10,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,14,10,0.32) 1px, transparent 1px), linear-gradient(180deg, #5a3b2b 0%, #3e281d 100%)",
          backgroundSize: "60px 60px, 60px 60px, auto"
        }}
      />

      {/* Furniture cluster */}
      <div className="absolute left-1/2 bottom-[12%] z-10 grid w-[44rem] -translate-x-1/2 grid-cols-3 gap-7">
        <ReadingTable className="[transform:rotate(-8deg)]" />
        <ReadingTable className="translate-y-4 [transform:rotate(0deg)]" />
        <ReadingTable className="[transform:rotate(8deg)]" />
      </div>

      {/* Center lectern */}
      <div className="absolute left-1/2 bottom-[4%] z-20 w-[30rem] -translate-x-1/2">
        <Lectern />
      </div>
    </section>
  );
}
