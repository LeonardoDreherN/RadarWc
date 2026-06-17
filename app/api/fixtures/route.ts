import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getUpcomingFixtures, getLiveFixtures } from "@/lib/football-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = supabaseAdmin();

  // Tenta servir do cache primeiro
  const { data: cached } = await db
    .from("fixtures_cache")
    .select("data, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const cacheAge = cached
    ? (Date.now() - new Date(cached.updated_at).getTime()) / 1000
    : Infinity;

  if (cached && cacheAge < 300) {
    return NextResponse.json(cached.data);
  }

  // Cache expirado → busca da API
  const [upcoming, live] = await Promise.all([
    getUpcomingFixtures(20),
    getLiveFixtures(),
  ]);

  const fixtures = [...live, ...upcoming];

  // Salva no cache
  await Promise.all(
    fixtures.map((f) =>
      db.from("fixtures_cache").upsert({
        fixture_id: f.fixture.id,
        data: f,
        updated_at: new Date().toISOString(),
      })
    )
  );

  return NextResponse.json({ live, upcoming, updatedAt: new Date().toISOString() });
}
