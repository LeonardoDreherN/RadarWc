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

  // Se um jogo aparece como ativo no endpoint geral mas NÃO está na lista de live,
  // o endpoint geral está desatualizado — força status como encerrado
  const ACTIVE = ["1H", "HT", "ET", "P"];
  const merged = all.map((f) => {
    const liveVersion = liveMap.get(f.fixture.id);
    if (liveVersion) return liveVersion;
    if (ACTIVE.includes(f.fixture.status.short)) {
      return {
        ...f,
        fixture: { ...f.fixture, status: { short: "FT", elapsed: null } },
      };
    }
    return f;
  });

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
