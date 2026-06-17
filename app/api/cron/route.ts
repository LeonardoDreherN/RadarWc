import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getWorldCupFixtures, getLiveFixtures } from "@/lib/football-api";

// Chamado pelo Vercel Cron ou externamente com o header Authorization
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const [all, live] = await Promise.all([
    getWorldCupFixtures(),
    getLiveFixtures(),
  ]);

  // Merge: jogos ao vivo sobrescrevem o placar nos dados gerais
  const liveMap = new Map(live.map((f) => [f.fixture.id, f]));
  const merged = all.map((f) => liveMap.get(f.fixture.id) ?? f);

  await Promise.all(
    merged.map((f) =>
      db.from("fixtures_cache").upsert({
        fixture_id: f.fixture.id,
        data: f,
        updated_at: new Date().toISOString(),
      })
    )
  );

  // Invalida análises dos jogos ao vivo para forçar recalculo
  if (live.length > 0) {
    await db
      .from("analysis_cache")
      .delete()
      .in(
        "fixture_id",
        live.map((f) => f.fixture.id)
      );
  }

  return NextResponse.json({
    ok: true,
    total: merged.length,
    live: live.length,
    updatedAt: new Date().toISOString(),
  });
}
