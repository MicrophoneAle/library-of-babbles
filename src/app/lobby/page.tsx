import Bookshelf from "@/components/lobby/Bookshelf";
import GoldSign from "@/components/lobby/GoldSign";
import Lectern from "@/components/lobby/Lectern";
import Vine from "@/components/lobby/Vine";
import WindowLight from "@/components/lobby/WindowLight";

export default function LobbyPage() {
  return (
    <section className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-amber-100">First-Floor Lobby</h1>
        <p className="mx-auto mt-3 max-w-2xl text-parchment/85">
          A vaulted room of warm wood and brass. Pathways branch to each wing while the central
          lectern welcomes visitors.
        </p>
      </header>

      <div className="relative mx-auto h-[48rem] max-w-6xl overflow-hidden rounded-2xl border border-amber-100/15 bg-[#2a1a12] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-[#6a4a2b] via-[#3d2718] to-[#23150f]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#2a1a11] to-[#4a3020]" />
        <div className="absolute left-1/2 top-[54%] h-[22rem] w-[95%] -translate-x-1/2 rounded-[50%] border border-amber-100/10 bg-black/20" />

        {/* Side bookshelves */}
        <Bookshelf className="absolute left-6 top-10 w-56" compact />
        <Bookshelf className="absolute right-6 top-10 w-56" compact />
        <Vine className="absolute left-3 top-8" />
        <Vine className="absolute right-3 top-8 scale-x-[-1]" />

        {/* Warm window glow */}
        <div className="absolute left-1/2 top-8 w-80 -translate-x-1/2">
          <WindowLight />
        </div>

        {/* 3D doorway openings and signs */}
        <div className="absolute left-1/2 top-[30%] grid w-[75%] -translate-x-1/2 grid-cols-2 gap-8">
          <div>
            <div className="gold-sign mb-2 rounded px-3 py-1 text-center text-sm font-semibold text-walnut">
              ABOUT WING
            </div>
            <div className="h-40 rounded-b-[2rem] border border-amber-100/20 bg-black/35 p-2">
              <GoldSign label="Enter About" href="/about" />
            </div>
          </div>
          <div>
            <div className="gold-sign mb-2 rounded px-3 py-1 text-center text-sm font-semibold text-walnut">
              PROJECTS WING
            </div>
            <div className="h-40 rounded-b-[2rem] border border-amber-100/20 bg-black/35 p-2">
              <GoldSign label="Enter Projects" href="/projects" />
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 top-[64%] grid w-[75%] -translate-x-1/2 grid-cols-2 gap-8">
          <div>
            <div className="gold-sign mb-2 rounded px-3 py-1 text-center text-sm font-semibold text-walnut">
              BLOG ALCOVE
            </div>
            <div className="h-32 rounded-b-[2rem] border border-amber-100/20 bg-black/35 p-2">
              <GoldSign label="Enter Blog" href="/blog" />
            </div>
          </div>
          <div>
            <div className="gold-sign mb-2 rounded px-3 py-1 text-center text-sm font-semibold text-walnut">
              LIBRARY RECORDS
            </div>
            <div className="h-32 rounded-b-[2rem] border border-amber-100/20 bg-black/35 p-2">
              <GoldSign label="Enter Books" href="/books" />
            </div>
          </div>
        </div>

        {/* Center lectern */}
        <div className="absolute left-1/2 top-[54%] z-10 w-[26rem] -translate-x-1/2">
          <Lectern />
        </div>

        {/* Stairs to future floor, blocked */}
        <div className="absolute left-1/2 bottom-8 w-[26rem] -translate-x-1/2">
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-3 rounded border border-amber-200/10 bg-[#3a2418]" />
            ))}
          </div>
          <div className="mt-3 rounded-md border border-red-300/40 bg-red-900/45 px-3 py-2 text-center text-sm font-semibold text-red-200">
            Upper Floor Staircase - Under Construction
          </div>
        </div>
      </div>
    </section>
  );
}
