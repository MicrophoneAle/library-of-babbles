const posts = [
  {
    title: "Why a Library Theme?",
    date: "2026-03-24",
    excerpt: "A personal note on memory palaces, shelves, and software as architecture."
  },
  {
    title: "Building First-Floor Navigation",
    date: "2026-03-24",
    excerpt: "Designing immersive wayfinding with carved signs, pathways, and atmosphere."
  }
];

export default function BlogPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold text-amber-100">Personal Blog</h1>
      {posts.map((post) => (
        <article key={post.title} className="rounded-lg border border-amber-100/10 bg-walnut/55 p-5">
          <h2 className="text-xl font-semibold">{post.title}</h2>
          <p className="text-xs uppercase tracking-wide text-amber-200/80">{post.date}</p>
          <p className="mt-2 text-sm text-parchment/85">{post.excerpt}</p>
        </article>
      ))}
    </section>
  );
}
