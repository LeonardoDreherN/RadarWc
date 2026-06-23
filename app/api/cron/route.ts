import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getWorldCupFixtures, getLiveFixtures, getH2H, type Fixture } from "@/lib/football-api";
import { evaluatePrediction } from "@/lib/accuracy";
import { analyzeMatchWithAI, analyzeTeamStyles } from "@/lib/gemini";
import { buildH2HSummary } from "@/lib/analysis";

const FINISHED = ["FT", "AET", "PEN"];

async function evaluateFinishedMatches(db: ReturnType<typeof supabaseAdmin>, finished: Fixture[]) {
  if (finished.length === 0) return;

  // Busca quais já foram avaliados
  const ids = finished.map((f) => f.fixture.id);
  const { data: already } = await db
    .from("prediction_results")
    .select("fixture_id")
    .in("fixture_id", ids);

  const evaluated = new Set((already ?? []).map((r: { fixture_id: number }) => r.fixture_id));
  const toEvaluate = finished.filter((f) => !evaluated.has(f.fixture.id));
  if (toEvaluate.length === 0) return;

  // Busca análises em cache para esses jogos
  const { data: analyses } = await db
    .from("analysis_cache")
    .select("fixture_id, data")
    .in("fixture_id", toEvaluate.map((f) => f.fixture.id));

  if (!analyses || analyses.length === 0) return;

  const analysisMap = new Map(analyses.map((a: { fixture_id: number; data: { aiAnalysis?: { labels?: { market: string; suggestion: string }[] } } }) => [a.fixture_id, a.data]));

  const rows: { fixture_id: number; market: string; suggestion: string; correct: boolean }[] = [];

  for (const fixture of toEvaluate) {
    const analysis = analysisMap.get(fixture.fixture.id);
    if (!analysis?.aiAnalysis?.labels) continue;

    for (const label of analysis.aiAnalysis.labels) {
      const correct = evaluatePrediction(label.market, label.suggestion, fixture);
      if (correct === null) continue; // mercado não avaliável
      rows.push({
        fixture_id: fixture.fixture.id,
        market: label.market,
        suggestion: label.suggestion,
        correct,
      });
    }
  }

  if (rows.length > 0) {
    await db.from("prediction_results").upsert(rows, { onConflict: "fixture_id,market" });
  }
}

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

  const liveMap = new Map(live.map((f) => [f.fixture.id, f]));

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

  if (live.length > 0) {
    await db
      .from("analysis_cache")
      .delete()
      .in("fixture_id", live.map((f) => f.fixture.id));
  }

  // Avalia previsões dos jogos encerrados
  const finished = merged.filter((f) => FINISHED.includes(f.fixture.status.short));
  await evaluateFinishedMatches(db, finished);

  // Pré-gera análise para os próximos 8 jogos sem cache
  const upcoming = merged
    .filter((f) => f.fixture.status.short === "NS")
    .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
    .slice(0, 8);

  if (upcoming.length > 0) {
    const cachedIds = await db
      .from("analysis_cache")
      .select("fixture_id, updated_at")
      .in("fixture_id", upcoming.map((f) => f.fixture.id));

    const now = Date.now();
    const stale = new Set(
      upcoming
        .filter((f) => {
          const cached = (cachedIds.data ?? []).find((c: { fixture_id: number; updated_at: string }) => c.fixture_id === f.fixture.id);
          if (!cached) return true;
          const age = (now - new Date(cached.updated_at).getTime()) / 3600000;
          return age > 6;
        })
        .map((f) => f.fixture.id)
    );

    for (const f of upcoming) {
      if (!stale.has(f.fixture.id)) continue;
      try {
        const [h2h, aiAnalysis, teamStyles] = await Promise.all([
          getH2H(f.teams.home.id, f.teams.away.id, f.fixture.id).catch(() => []),
          analyzeMatchWithAI(f.teams.home.name, f.teams.away.name, f.fixture.id, { total: 0, homeWins: 0, awayWins: 0, draws: 0, avgGoals: 0, bttsCount: 0 }, f.league.round),
          analyzeTeamStyles(f.teams.home.name, f.teams.away.name).catch(() => null),
        ]);
        const h2hSummary = buildH2HSummary(h2h, f.teams.home.id);
        await db.from("analysis_cache").upsert({
          fixture_id: f.fixture.id,
          data: { aiAnalysis, historicalAnalysis: null, h2hSummary, teamStyles },
          updated_at: new Date().toISOString(),
        });
      } catch {
        // ignora erros individuais para não travar o cron
      }
    }
  }

  return NextResponse.json({
    ok: true,
    total: merged.length,
    live: live.length,
    evaluated: finished.length,
    updatedAt: new Date().toISOString(),
  });
}
