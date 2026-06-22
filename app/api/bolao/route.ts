import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fixture_id, home_goals, away_goals } = await req.json();

  if (typeof fixture_id !== "number" || typeof home_goals !== "number" || typeof away_goals !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: cached } = await db.from("fixtures_cache").select("data").eq("fixture_id", fixture_id).single();
  if (!cached) return NextResponse.json({ error: "Fixture not found" }, { status: 404 });

  const status = cached.data?.fixture?.status?.short;
  if (status !== "NS") return NextResponse.json({ error: "Match already started" }, { status: 400 });

  await db.from("bolao_picks").upsert(
    { user_id: user.id, fixture_id, home_goals, away_goals, updated_at: new Date().toISOString() },
    { onConflict: "user_id,fixture_id" }
  );

  return NextResponse.json({ ok: true });
}
