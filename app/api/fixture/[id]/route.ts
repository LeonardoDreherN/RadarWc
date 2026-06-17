import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getFixtureStats,
  getFixtureOdds,
  getTeamFixtureHistory,
  getH2H,
} from "@/lib/football-api";
import {
  analyzeGoals,
  analyzeCorners,
  analyzeCards,
  analyzeResult,
  buildH2HSummary,
  parseMatchOdds,
  type MatchAnalysis,
} from "@/lib/analysis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fixtureId = parseInt(id);
  const db = supabaseAdmin();

  // Cache de análise (válido por 1 hora)
  const { data: cached } = await db
    .from("analysis_cache")
    .select("data, updated_at")
    .eq("fixture_id", fixtureId)
    .single();

  const cacheAge = cached
    ? (Date.now() - new Date(cached.updated_at).getTime()) / 1000
    : Infinity;

  if (cached && cacheAge < 3600) {
    return NextResponse.json(cached.data);
  }

  // Busca o jogo do cache de fixtures
  const { data: fixtureRow } = await db
    .from("fixtures_cache")
    .select("data")
    .eq("fixture_id", fixtureId)
    .single();

  if (!fixtureRow) {
    return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
  }

  const fixture = fixtureRow.data;
  const homeId: number = fixture.teams.home.id;
  const awayId: number = fixture.teams.away.id;

  const [fixtureStats, oddsData, homeHistory, awayHistory, h2h] =
    await Promise.all([
      getFixtureStats(fixtureId),
      getFixtureOdds(fixtureId),
      getTeamFixtureHistory(homeId),
      getTeamFixtureHistory(awayId),
      getH2H(homeId, awayId),
    ]);

  // Extrai estatísticas por time para análise de escanteios/cartões
  const homeStats = fixtureStats.find((s) => s.team.id === homeId)?.statistics ?? [];
  const awayStats = fixtureStats.find((s) => s.team.id === awayId)?.statistics ?? [];

  // Monta histórico de estatísticas de jogos passados
  const historicalStats = [homeStats, awayStats].filter((s) => s.length > 0);

  const labels = [
    ...analyzeGoals(homeHistory, awayHistory, homeId, awayId),
    ...analyzeResult(h2h, homeHistory, awayHistory, homeId, awayId),
    ...(historicalStats.length > 0 ? analyzeCorners(historicalStats) : []),
    ...(historicalStats.length > 0 ? analyzeCards(historicalStats) : []),
  ].sort((a, b) => b.confidence - a.confidence);

  const analysis: MatchAnalysis = {
    fixtureId,
    home: fixture.teams.home.name,
    away: fixture.teams.away.name,
    labels,
    h2hSummary: buildH2HSummary(h2h, homeId),
    oddImplied: oddsData ? (parseMatchOdds(oddsData.bookmakers) ?? undefined) : undefined,
  };

  // Salva análise no cache
  await db.from("analysis_cache").upsert({
    fixture_id: fixtureId,
    data: analysis,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json(analysis);
}
