import type { Fixture } from "./football-api";

export interface AccuracyStat {
  market: string;
  correct: number;
  total: number;
  pct: number;
}

export function evaluatePrediction(
  market: string,
  suggestion: string,
  fixture: Fixture
): boolean | null {
  const totalGoals = (fixture.goals.home ?? 0) + (fixture.goals.away ?? 0);
  const homeGoals = fixture.goals.home ?? 0;
  const awayGoals = fixture.goals.away ?? 0;
  const htTotal = (fixture.score?.halftime?.home ?? 0) + (fixture.score?.halftime?.away ?? 0);
  const homeWon = fixture.teams.home.winner === true;
  const awayWon = fixture.teams.away.winner === true;
  const drew = !homeWon && !awayWon;

  const m = market.toLowerCase();
  const s = suggestion.toLowerCase();

  if (m.includes("gols no jogo")) {
    if (s.includes("mais de 2.5")) return totalGoals > 2.5;
    if (s.includes("menos de 2.5")) return totalGoals < 2.5;
  }

  if (m.includes("ambas marcam")) {
    const btts = homeGoals > 0 && awayGoals > 0;
    if (s.includes("sim")) return btts;
    if (s.includes("não") || s.includes("nao") || s.includes("pelo menos")) return !btts;
  }

  if (m.includes("gol no 1") || m.includes("gol antes")) {
    const htGoal = htTotal > 0;
    if (s.includes("provável") && !s.includes("improvável") && !s.includes("sem gol")) return htGoal;
    if (s.includes("improvável") || s.includes("sem gol")) return !htGoal;
  }

  if (m.includes("resultado final") || m.includes("resultado")) {
    const home = fixture.teams.home.name.toLowerCase();
    const away = fixture.teams.away.name.toLowerCase();
    if (s.includes("empate")) return drew;
    if (s.includes(home.split(" ")[0]) || s.includes(home)) return homeWon;
    if (s.includes(away.split(" ")[0]) || s.includes(away)) return awayWon;
  }

  if (m.includes("mais de 1.5")) return totalGoals > 1.5;
  if (m.includes("menos de 1.5")) return totalGoals < 1.5;

  // Escanteios, cartões, handicap etc. — sem dados suficientes
  return null;
}
