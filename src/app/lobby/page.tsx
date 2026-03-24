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
          Warm sunlight spills through arched windows while carved signs point toward the halls of
          projects, stories, and shelves.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6 rounded-2xl border border-amber-100/10 bg-walnut/55 p-6 shadow-xl">
          <WindowLight />
          <Lectern />
        </div>
        <div className="relative rounded-2xl border border-amber-100/10 bg-walnut/55 p-6">
          <Vine className="absolute left-2 top-2" />
          <h2 className="mb-4 text-xl font-semibold text-amber-50">Navigation Hall</h2>
          <div className="grid gap-3">
            <GoldSign label="About / Introduction" href="/about" />
            <GoldSign label="Projects Wing" href="/projects" />
            <GoldSign label="Personal Blog Alcove" href="/blog" />
            <GoldSign label="Books and Library Records" href="/books" />
          </div>
          <div className="mt-8 rounded-lg border border-red-300/30 bg-red-900/30 p-3 text-sm text-red-200">
            Stairway to Upper Floors: Under Construction
          </div>
        </div>
      </div>

      <Bookshelf />
    </section>
  );
}
