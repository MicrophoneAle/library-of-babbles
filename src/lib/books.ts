import { sampleBooks } from "@/lib/sample-books";
import { getSupabaseServerClient } from "@/lib/supabase";
import { Book, ReadingStatus } from "@/types";

export interface BookFilters {
  status?: ReadingStatus | "all";
  genre?: string;
  author?: string;
  sortBy?: "created_at" | "title" | "author" | "started_at" | "finished_at";
  sortDirection?: "asc" | "desc";
}

export async function getBooks(filters: BookFilters = {}): Promise<Book[]> {
  const client = getSupabaseServerClient();
  if (!client) {
    return sampleBooks;
  }

  let query = client.from("books").select("*");

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.genre) {
    query = query.ilike("genre", `%${filters.genre}%`);
  }
  if (filters.author) {
    query = query.ilike("author", `%${filters.author}%`);
  }

  const sortBy = filters.sortBy ?? "created_at";
  const ascending = filters.sortDirection === "asc";
  query = query.order(sortBy, { ascending });

  const { data, error } = await query;
  if (error) {
    console.error("Supabase books query failed:", error.message);
    return sampleBooks;
  }

  return (data as Book[]) ?? sampleBooks;
}
