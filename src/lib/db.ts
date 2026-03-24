// Compatibility shim so future migrations to Prisma keep the same import path.
// Current implementation uses Supabase as the PostgreSQL data layer.
export { getSupabaseServerClient as db } from "./supabase";
