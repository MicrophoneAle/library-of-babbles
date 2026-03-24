import { Book } from "@/types";

export const sampleBooks: Book[] = [
  {
    id: "sample-1",
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    genre: "Fantasy",
    status: "read",
    rating: 5,
    review: "Lyrical and immersive, like hearing stories by candlelight.",
    started_at: "2025-01-10",
    finished_at: "2025-01-18"
  },
  {
    id: "sample-2",
    title: "Piranesi",
    author: "Susanna Clarke",
    genre: "Magical Realism",
    status: "currently_reading",
    notes: "The worldbuilding feels like wandering a forgotten wing of an old library.",
    started_at: "2026-03-05"
  },
  {
    id: "sample-3",
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    genre: "Science Fiction",
    status: "want_to_read"
  }
];
