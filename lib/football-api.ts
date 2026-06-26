import axios from "axios";

// Copa do Mundo 2026 — código fixo na football-data.org
const WC_CODE = "WC";

const api = axios.create({
  baseURL: "https://api.football-data.org/v4",
  headers: {
    "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY,
  },
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Fixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
    venue: { name: string; city: string };
  };
  league: { id: number; name: string; round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
}

export interface FixtureStats {
  team: { id: number; name: string };
  statistics: Array<{ type: string; value: string | number | null }>;
}

export interface FixtureOdds {
  bookmakers: Array<{
    name: string;
    bets: Array<{
      name: string;
      values: Array<{ value: string; odd: string }>;
    }>;
  }>;
}

export interface TeamStats {
  fixtures: {
    played: { total: number };
    wins: { total: number };
    draws: { total: number };
    loses: { total: number };
  };
  goals: {
    for: { average: { total: string } };
    against: { average: { total: string } };
  };
}

// ─── Conversor football-data.org → formato interno ───────────────────────────

function statusMap(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "NS",
    TIMED: "NS",
    IN_PLAY: "1H",
    PAUSED: "HT",
    EXTRA_TIME: "ET",
    PENALTY_SHOOTOUT: "P",
    FINISHED: "FT",
    AWARDED: "FT",
    POSTPONED: "PST",
    CANCELLED: "CANC",
  };
  return map[status] ?? "NS";
}

const STAGE_MAP: Record<string, string> = {
  GROUP_STAGE: "Fase de Grupos",
  LAST_32: "16 Avos de Final",
  LAST_16: "Oitavas de Final",
  ROUND_OF_32: "16 Avos de Final",
  ROUND_OF_16: "Oitavas de Final",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinal",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

function translateStage(stage: string): string {
  return STAGE_MAP[stage] ?? stage;
}

function toFixture(m: FDMatch): Fixture {
  const homeWinner =
    m.score.winner === "HOME_TEAM"
      ? true
      : m.score.winner === "AWAY_TEAM"
      ? false
      : null;
  const awayWinner =
    m.score.winner === "AWAY_TEAM"
      ? true
      : m.score.winner === "HOME_TEAM"
      ? false
      : null;

  return {
    fixture: {
      id: m.id,
      date: m.utcDate,
      status: {
        short: statusMap(m.status),
        elapsed: m.minute ?? null,
      },
      venue: { name: m.venue ?? "", city: "" },
    },
    league: {
      id: 1,
      name: "FIFA World Cup 2026",
      round: translateStage(m.stage ?? m.group ?? ""),
    },
    teams: {
      home: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
        logo: m.homeTeam.crest ?? "",
        winner: homeWinner,
      },
      away: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
        logo: m.awayTeam.crest ?? "",
        winner: awayWinner,
      },
    },
    goals: {
      home: m.score.fullTime.home,
      away: m.score.fullTime.away,
    },
    score: {
      halftime: {
        home: m.score.halfTime.home,
        away: m.score.halfTime.away,
      },
      fulltime: {
        home: m.score.fullTime.home,
        away: m.score.fullTime.away,
      },
    },
  };
}

// Tipo cru da football-data.org
interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  minute?: number;
  stage?: string;
  group?: string;
  venue?: string;
  homeTeam: { id: number; name: string; crest?: string };
  awayTeam: { id: number; name: string; crest?: string };
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}

// ─── Funções públicas ─────────────────────────────────────────────────────────

export async function getWorldCupFixtures(): Promise<Fixture[]> {
  const { data } = await api.get(`/competitions/${WC_CODE}/matches`);
  return (data.matches as FDMatch[]).map(toFixture);
}

export async function getLiveFixtures(): Promise<Fixture[]> {
  const { data } = await api.get(`/competitions/${WC_CODE}/matches`, {
    params: { status: "LIVE" },
  });
  return (data.matches as FDMatch[]).map(toFixture);
}

export async function getUpcomingFixtures(next = 10): Promise<Fixture[]> {
  const { data } = await api.get(`/competitions/${WC_CODE}/matches`, {
    params: { status: "SCHEDULED,TIMED,PAUSED,IN_PLAY" },
  });
  return (data.matches as FDMatch[]).slice(0, next).map(toFixture);
}

// football-data.org não tem stats por jogo no plano free — retorna vazio
export async function getFixtureStats(_fixtureId: number): Promise<FixtureStats[]> {
  return [];
}

// Odds não disponíveis no plano free — retorna null
export async function getFixtureOdds(_fixtureId: number): Promise<FixtureOdds> {
  return { bookmakers: [] };
}

export async function getTeamFixtureHistory(
  teamId: number,
  last = 10
): Promise<Fixture[]> {
  // Busca WC 2026 + EC 2024 — competições internacionais no plano free
  const results = await Promise.allSettled([
    api.get(`/teams/${teamId}/matches`, {
      params: { competitions: "WC", status: "FINISHED", limit: last },
    }),
    api.get(`/teams/${teamId}/matches`, {
      params: { competitions: "EC", status: "FINISHED", limit: last },
    }),
  ]);

  const matches: FDMatch[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      matches.push(...(r.value.data.matches as FDMatch[]));
    }
  }

  return matches
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, last)
    .map(toFixture);
}

export async function getH2H(
  _homeId: number,
  _awayId: number,
  fixtureId?: number
): Promise<Fixture[]> {
  if (!fixtureId) return [];
  const { data } = await api.get(`/matches/${fixtureId}/head2head`, {
    params: { limit: 10 },
  });
  return (data.matches as FDMatch[]).map(toFixture);
}

export async function getTeamStats(_teamId: number): Promise<TeamStats> {
  return {
    fixtures: { played: { total: 0 }, wins: { total: 0 }, draws: { total: 0 }, loses: { total: 0 } },
    goals: { for: { average: { total: "0" } }, against: { average: { total: "0" } } },
  };
}

export interface Standing {
  position: number;
  team: { id: number; name: string; crest: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string;
}

export interface Group {
  group: string;
  table: Standing[];
}

export async function getStandings(): Promise<Group[]> {
  try {
    const { data } = await api.get(`/competitions/${WC_CODE}/standings`);
    const standings = data.standings as Array<{
      group: string;
      type: string;
      table: Standing[];
    }>;
    return standings
      .filter((s) => s.type === "TOTAL")
      .map((s) => ({ group: s.group, table: s.table }))
      .sort((a, b) => a.group.localeCompare(b.group));
  } catch {
    return [];
  }
}

export interface Scorer {
  player: { id: number; name: string; nationality: string };
  team: { id: number; name: string; crest: string };
  goals: number;
  assists: number;
  penalties: number;
}

export async function getScorers(limit = 20): Promise<Scorer[]> {
  try {
    const { data } = await api.get(`/competitions/${WC_CODE}/scorers`, {
      params: { limit },
    });
    return data.scorers as Scorer[];
  } catch {
    return [];
  }
}

const KNOCKOUT_STAGES = ["LAST_32", "LAST_16", "ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];

export async function getKnockoutMatches(): Promise<Record<string, Fixture[]>> {
  try {
    const { data } = await api.get(`/competitions/${WC_CODE}/matches`);
    const matches = (data.matches as FDMatch[]).filter((m) =>
      KNOCKOUT_STAGES.includes(m.stage ?? "")
    );
    const grouped: Record<string, Fixture[]> = {};
    for (const m of matches) {
      const stage = m.stage ?? "UNKNOWN";
      if (!grouped[stage]) grouped[stage] = [];
      grouped[stage].push(toFixture(m));
    }
    return grouped;
  } catch {
    return {};
  }
}
