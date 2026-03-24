import { getSupabaseServerClient } from "@/lib/supabase";
import { sampleBooks } from "@/lib/sample-books";
import { ReadingStatus } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json(sampleBooks);
  }

  const { data, error } = await client.from("books").select("*").order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json(
      { message: "Supabase is not configured. Set environment variables first." },
      { status: 400 }
    );
  }

  const body = (await req.json()) as {
    title?: string;
    author?: string;
    genre?: string;
    status?: ReadingStatus;
    rating?: number | null;
    notes?: string | null;
    review?: string | null;
    cover_image_url?: string | null;
    started_at?: string | null;
    finished_at?: string | null;
  };

  if (!body.title || !body.author || !body.genre || !body.status) {
    return NextResponse.json(
      { message: "title, author, genre, and status are required." },
      { status: 422 }
    );
  }

  const { data, error } = await client.from("books").insert(body).select("*").single();
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
