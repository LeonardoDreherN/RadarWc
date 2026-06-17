import type { Fixture } from "./football-api";

export type RiskLevel = "baixo" | "medio" | "alto" | "nao_apostar";

export interface BetLabel {
  market: string;
  suggestion: string;
  confidence: number;
  basis: string;
  totalGames: number;
  hits: number;
  risk: RiskLevel;
}

export interface MatchAnalysis {
  fixtureId: number;
  home: string;
  away: string;
  labels: BetLabel[];
  h2hSummary: H2HSummary;
  oddImplied?: OddImplied;
  isAiAnalysis?: boolean;
}

export interface H2HSummary {
  total: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  avgGoals: number;
  bttsCount: number;
}

export interface OddImplied {
  home: number;
  draw: number;
  away: number;
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

function pct(hits: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((hits / total) * 100);
}

export function computeRisk(confidence: number, positive = true): RiskLevel {
  if (!positive) return "nao_apostar";
  if (confidence > 65) return "baixo";
  if (confidence > 30) return "medio";
  return "alto";
}

// ─── Análise de gols ─────────────────────────────────────────────────────────

export function analyzeGoals(
  homeHistory: Fixture[],
  awayHistory: Fixture[],
  homeId: number,
  awayId: number
): BetLabel[] {
  const labels: BetLabel[] = [];

  const allGames = [...homeHistory, ...awayHistory].filter(
    (f) => f.goals.home !== null && f.goals.away !== null
  );

  if (allGames.length === 0) return labels;

  // Mais de 2.5 gols
  const over25 = allGames.filter((f) => (f.goals.home ?? 0) + (f.goals.away ?? 0) > 2.5);
  const over25Pct = pct(over25.length, allGames.length);
  const over25Positive = over25Pct >= 55;
  labels.push({
    market: "Gols no Jogo",
    suggestion: over25Positive ? "Mais de 2.5 Gols" : "Menos de 2.5 Gols",
    confidence: over25Positive ? over25Pct : 100 - over25Pct,
    basis: `${over25.length} de ${allGames.length} jogos tiveram mais de 2 gols`,
    totalGames: allGames.length,
    hits: over25Positive ? over25.length : allGames.length - over25.length,
    risk: computeRisk(over25Positive ? over25Pct : 100 - over25Pct, true),
  });

  // Ambas marcam
  const btts = allGames.filter((f) => (f.goals.home ?? 0) > 0 && (f.goals.away ?? 0) > 0);
  const bttsPct = pct(btts.length, allGames.length);
  const bttsPositive = bttsPct >= 55;
  labels.push({
    market: "Ambas Marcam",
    suggestion: bttsPositive ? "Sim — Ambas as equipes marcam" : "Não — Pelo menos uma equipe não marca",
    confidence: bttsPositive ? bttsPct : 100 - bttsPct,
    basis: `${btts.length} de ${allGames.length} jogos tiveram gol dos dois lados`,
    totalGames: allGames.length,
    hits: bttsPositive ? btts.length : allGames.length - btts.length,
    risk: computeRisk(bttsPositive ? bttsPct : 100 - bttsPct, true),
  });

  // Gol no 1° tempo
  const firstHalf = allGames.filter(
    (f) => (f.score?.halftime?.home ?? 0) > 0 || (f.score?.halftime?.away ?? 0) > 0
  );
  const fhPct = pct(firstHalf.length, allGames.length);
  labels.push({
    market: "Gol no 1° Tempo",
    suggestion: fhPct >= 60 ? "Gol antes do intervalo — Provável" : "Sem gol no 1° tempo — Mais provável",
    confidence: fhPct >= 60 ? fhPct : 100 - fhPct,
    basis: `${firstHalf.length} de ${allGames.length} jogos tiveram gol no 1° tempo`,
    totalGames: allGames.length,
    hits: fhPct >= 60 ? firstHalf.length : allGames.length - firstHalf.length,
    risk: computeRisk(fhPct >= 60 ? fhPct : 100 - fhPct, true),
  });

  return labels;
}

// ─── Análise de escanteios ────────────────────────────────────────────────────

export function analyzeCorners(
  fixtureStatsList: Array<Array<{ type: string; value: string | number | null }>>
): BetLabel[] {
  const labels: BetLabel[] = [];

  function statValue(stats: Array<{ type: string; value: string | number | null }>, type: string): number {
    const s = stats.find((x) => x.type === type);
    if (!s || s.value === null) return 0;
    return parseFloat(String(s.value).replace("%", "")) || 0;
  }

  const totals = fixtureStatsList.map((stats) => statValue(stats, "Corner Kicks"));
  if (totals.length === 0) return labels;

  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  const over85 = totals.filter((v) => v > 8.5).length;
  const over85Pct = pct(over85, totals.length);
  const over85Positive = over85Pct >= 55;

  labels.push({
    market: "Escanteios no Jogo",
    suggestion: over85Positive ? "Mais de 8.5 escanteios" : "Menos de 8.5 escanteios",
    confidence: over85Positive ? over85Pct : 100 - over85Pct,
    basis: `Média de ${avg.toFixed(1)} escanteios/jogo — ${over85} de ${totals.length} passaram de 8`,
    totalGames: totals.length,
    hits: over85Positive ? over85 : totals.length - over85,
    risk: computeRisk(over85Positive ? over85Pct : 100 - over85Pct, true),
  });

  return labels;
}

// ─── Análise de cartões ───────────────────────────────────────────────────────

export function analyzeCards(
  fixtureStatsList: Array<Array<{ type: string; value: string | number | null }>>
): BetLabel[] {
  const labels: BetLabel[] = [];

  function statValue(stats: Array<{ type: string; value: string | number | null }>, type: string): number {
    const s = stats.find((x) => x.type === type);
    if (!s || s.value === null) return 0;
    return parseFloat(String(s.value).replace("%", "")) || 0;
  }

  const totals = fixtureStatsList.map(
    (stats) => statValue(stats, "Yellow Cards") + statValue(stats, "Red Cards")
  );
  if (totals.length === 0) return labels;

  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  const over35 = totals.filter((v) => v > 3.5).length;
  const over35Pct = pct(over35, totals.length);
  const over35Positive = over35Pct >= 55;

  labels.push({
    market: "Cartões no Jogo",
    suggestion: over35Positive ? "Mais de 3.5 cartões" : "Menos de 3.5 cartões",
    confidence: over35Positive ? over35Pct : 100 - over35Pct,
    basis: `Média de ${avg.toFixed(1)} cartões/jogo — ${over35} de ${totals.length} tiveram mais de 3`,
    totalGames: totals.length,
    hits: over35Positive ? over35 : totals.length - over35,
    risk: computeRisk(over35Positive ? over35Pct : 100 - over35Pct, true),
  });

  return labels;
}

// ─── Análise de resultado (forma + H2H) ──────────────────────────────────────

export function analyzeResult(
  h2h: Fixture[],
  homeHistory: Fixture[],
  awayHistory: Fixture[],
  homeId: number,
  awayId: number
): BetLabel[] {
  const labels: BetLabel[] = [];

  const recentHome = homeHistory.slice(0, 5);
  const recentAway = awayHistory.slice(0, 5);

  const homePoints = recentHome.reduce((acc, f) => {
    const isHomeTeam = f.teams.home.id === homeId;
    const won = isHomeTeam ? f.teams.home.winner : f.teams.away.winner;
    const draw = f.teams.home.winner === null && f.teams.away.winner === null;
    return acc + (won ? 3 : draw ? 1 : 0);
  }, 0);

  const awayPoints = recentAway.reduce((acc, f) => {
    const isAwayTeam = f.teams.away.id === awayId;
    const won = isAwayTeam ? f.teams.away.winner : f.teams.home.winner;
    const draw = f.teams.home.winner === null && f.teams.away.winner === null;
    return acc + (won ? 3 : draw ? 1 : 0);
  }, 0);

  const totalPoints = homePoints + awayPoints;
  const homeFormPct = totalPoints > 0 ? pct(homePoints, totalPoints) : 50;
  const awayFormPct = 100 - homeFormPct;
  const bestFormPct = Math.max(homeFormPct, awayFormPct);

  const homeName = recentHome[0]?.teams.home.name ?? "Casa";
  const awayName = recentAway[0]?.teams.away.name ?? "Fora";

  let formaSugestao: string;
  if (homeFormPct > awayFormPct + 15) {
    formaSugestao = `${homeName} chega em melhor forma`;
  } else if (awayFormPct > homeFormPct + 15) {
    formaSugestao = `${awayName} chega em melhor forma`;
  } else {
    formaSugestao = "Times chegam em forma similar";
  }

  labels.push({
    market: "Forma Recente",
    suggestion: formaSugestao,
    confidence: bestFormPct,
    basis: `Pontos nos últimos 5 jogos — ${homeName}: ${homePoints}/15, ${awayName}: ${awayPoints}/15`,
    totalGames: 5,
    hits: homeFormPct > awayFormPct ? homePoints : awayPoints,
    risk: computeRisk(bestFormPct, true),
  });

  if (h2h.length > 0) {
    const h2hHomeWins = h2h.filter((f) => f.teams.home.id === homeId && f.teams.home.winner).length;
    const h2hAwayWins = h2h.filter((f) => f.teams.away.id === awayId && f.teams.away.winner).length;
    const h2hDraws = h2h.filter((f) => f.teams.home.winner === null).length;

    const dominant =
      h2hHomeWins > h2hAwayWins
        ? { label: `${homeName} domina o histórico de confrontos`, p: pct(h2hHomeWins, h2h.length), hits: h2hHomeWins }
        : h2hAwayWins > h2hHomeWins
        ? { label: `${awayName} domina o histórico de confrontos`, p: pct(h2hAwayWins, h2h.length), hits: h2hAwayWins }
        : { label: "Confronto histórico equilibrado", p: pct(h2hDraws, h2h.length), hits: h2hDraws };

    labels.push({
      market: "Confronto Direto (H2H)",
      suggestion: dominant.label,
      confidence: dominant.p,
      basis: `${h2h.length} confrontos — ${homeName}: ${h2hHomeWins}V, ${awayName}: ${h2hAwayWins}V, Empates: ${h2hDraws}`,
      totalGames: h2h.length,
      hits: dominant.hits,
      risk: computeRisk(dominant.p, true),
    });
  }

  return labels;
}

// ─── Odd implícita → probabilidade ───────────────────────────────────────────

export function oddToImplied(odd: number): number {
  if (odd <= 0) return 0;
  return Math.round((1 / odd) * 100);
}

export function parseMatchOdds(
  bookmakers: Array<{
    name: string;
    bets: Array<{ name: string; values: Array<{ value: string; odd: string }> }>;
  }>
): OddImplied | null {
  if (!bookmakers?.length) return null;
  const matchWinner = bookmakers[0]?.bets?.find((b) => b.name === "Match Winner");
  if (!matchWinner) return null;

  const homeOdd = parseFloat(matchWinner.values.find((v) => v.value === "Home")?.odd ?? "0");
  const drawOdd = parseFloat(matchWinner.values.find((v) => v.value === "Draw")?.odd ?? "0");
  const awayOdd = parseFloat(matchWinner.values.find((v) => v.value === "Away")?.odd ?? "0");

  return {
    home: oddToImplied(homeOdd),
    draw: oddToImplied(drawOdd),
    away: oddToImplied(awayOdd),
  };
}

// ─── H2H summary ─────────────────────────────────────────────────────────────

export function buildH2HSummary(h2h: Fixture[], homeId: number): H2HSummary {
  const played = h2h.filter((f) => f.goals.home !== null);

  const homeWins = played.filter(
    (f) =>
      (f.teams.home.id === homeId && f.teams.home.winner) ||
      (f.teams.away.id === homeId && f.teams.away.winner)
  ).length;

  const awayWins = played.filter(
    (f) =>
      (f.teams.home.id !== homeId && f.teams.home.winner) ||
      (f.teams.away.id !== homeId && f.teams.away.winner)
  ).length;

  const draws = played.filter(
    (f) => f.teams.home.winner === null && f.goals.home !== null
  ).length;

  const totalGoals = played.reduce(
    (acc, f) => acc + (f.goals.home ?? 0) + (f.goals.away ?? 0),
    0
  );

  const btts = played.filter(
    (f) => (f.goals.home ?? 0) > 0 && (f.goals.away ?? 0) > 0
  ).length;

  return {
    total: played.length,
    homeWins,
    awayWins,
    draws,
    avgGoals: played.length > 0 ? parseFloat((totalGoals / played.length).toFixed(2)) : 0,
    bttsCount: btts,
  };
}
