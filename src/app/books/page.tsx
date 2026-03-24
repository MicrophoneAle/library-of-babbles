import { getBooks } from "@/lib/books";
import { ReadingStatus } from "@/types";

const statusMap: Record<ReadingStatus, string> = {
  read: "Read",
  currently_reading: "Currently Reading",
  want_to_read: "Want to Read"
};

interface BooksPageProps {
  searchParams?: Promise<{
    status?: ReadingStatus | "all";
    genre?: string;
    author?: string;
    sortBy?: "created_at" | "title" | "author" | "started_at" | "finished_at";
    sortDirection?: "asc" | "desc";
  }>;
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const params = (await searchParams) ?? {};
  const books = await getBooks(params);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-amber-100">Library Records</h1>
        <p className="mt-2 text-sm text-parchment/85">
          Powered by Supabase when configured, with graceful sample data fallback for local preview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {books.map((book) => (
          <article key={book.id} className="rounded-lg border border-amber-100/10 bg-walnut/55 p-5">
            <h2 className="text-xl font-semibold">{book.title}</h2>
            <p className="text-sm text-parchment/85">
              {book.author} · {book.genre}
            </p>
            <p className="mt-2 inline-block rounded-full border border-brass/40 px-3 py-1 text-xs uppercase">
              {statusMap[book.status]}
            </p>
            {book.rating ? (
              <p className="mt-2 text-sm text-amber-200">Rating: {book.rating}/5</p>
            ) : null}
            {book.notes ? <p className="mt-2 text-sm text-parchment/85">{book.notes}</p> : null}
            {book.review ? <p className="mt-2 text-sm text-parchment/85">{book.review}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
