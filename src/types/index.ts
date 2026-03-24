export type ReadingStatus = "read" | "currently_reading" | "want_to_read";

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  status: ReadingStatus;
  rating?: number | null;
  notes?: string | null;
  review?: string | null;
  cover_image_url?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string;
}
