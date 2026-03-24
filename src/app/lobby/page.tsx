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
      {/* Rectangular-prism room shell */}
      <div className="absolute inset-0 bg-[#d2bea0]" />
      <div className="absolute inset-x-[16%] top-[10%] h-[52%] border border-[#d9c6a5]/60 bg-gradient-to-b from-[#dccbac] via-[#c8af89] to-[#b2946f]" />
      <div className="absolute left-0 top-[10%] h-[52%] w-[16%] border-r border-[#c6ad86]/70 bg-gradient-to-r from-[#9a7556] to-[#b8926e]" />
      <div className="absolute right-0 top-[10%] h-[52%] w-[16%] border-l border-[#c6ad86]/70 bg-gradient-to-l from-[#9a7556] to-[#b8926e]" />

      {/* Separate dome glass from wall with a cornice band */}
      <div className="absolute inset-x-[16%] top-[10%] h-6 border-b border-[#c8ad82] bg-[#b18c65]" />

      {/* Flattened top skylight */}
      <div className="absolute left-1/2 top-[1.5%] w-[22rem] -translate-x-1/2 opacity-95">
        <WindowLight />
      </div>

      {/* Wall-to-floor differentiator */}
      <div className="absolute inset-x-0 top-[62%] h-[6px] bg-[#7c573d] shadow-[0_-8px_18px_rgba(0,0,0,0.25)]" />

      {/* Bookshelves all over walls without overlap */}
      <Bookshelf className="absolute left-[2%] top-[14%] w-56" compact />
      <Bookshelf className="absolute left-[2%] top-[39%] w-56" compact />
      <Bookshelf className="absolute right-[2%] top-[14%] w-56" compact />
      <Bookshelf className="absolute right-[2%] top-[39%] w-56" compact />
      <Bookshelf className="absolute left-[20%] top-[14%] w-44" compact />
      <Bookshelf className="absolute right-[20%] top-[14%] w-44" compact />

      {/* Two far-side angled doorways, touching floor */}
      <Archway
        label="PROJECTS WING"
        href="/projects"
        className="absolute left-[17%] top-[31%] w-40 [transform:rotateY(17deg)]"
      />
      <Archway
        label="BLOG ALCOVE"
        href="/blog"
        className="absolute right-[17%] top-[31%] w-40 [transform:rotateY(-17deg)]"
      />

      {/* Flat wood plank floor (no square tiles) */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38%]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(37,23,16,0.35) 0 2px, transparent 2px 58px), repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, rgba(0,0,0,0.16) 1px 62px), linear-gradient(180deg, #6b4a35 0%, #3d271c 100%)",
          backgroundSize: "auto, auto, auto"
        }}
      />

      {/* Furniture cluster */}
      <div className="absolute left-1/2 bottom-[12%] z-10 grid w-[40rem] -translate-x-1/2 grid-cols-3 gap-6">
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
