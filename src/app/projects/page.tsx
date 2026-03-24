const projects = [
  {
    name: "Library of Babbles",
    summary: "A personal website + reading administration system with a mystical library aesthetic."
  },
  {
    name: "Shelf Whisperer (planned)",
    summary: "Future AI-based recommendation engine for books by taste, mood, and pacing."
  }
];

export default function ProjectsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold text-amber-100">Projects Wing</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <article key={project.name} className="rounded-lg border border-amber-100/10 bg-walnut/55 p-5">
            <h2 className="text-xl font-semibold text-parchment">{project.name}</h2>
            <p className="mt-2 text-sm text-parchment/85">{project.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
