import { supabaseAdmin } from "@/lib/supabase";
import { TrendingUp, Target, CheckCircle } from "lucide-react";
import type { AccuracyStat } from "@/lib/accuracy";
import { AccuracyStats } from "@/components/AccuracyStats";

async function getGlobalStats(): Promise<{ stats: AccuracyStat[]; totalGames: number; totalPredictions: number }> {
  const db = supabaseAdmin();
  const { data } = await db.from("prediction_results").select("market, correct, fixture_id");
  if (!data || data.length === 0) return { stats: [], totalGames: 0, totalPredictions: 0 };

  const rows = data as { market: string; correct: boolean; fixture_id: number }[];
  const map = new Map<string, { correct: number; total: number }>();
  const fixtures = new Set<number>();

  for (const row of rows) {
    const cur = map.get(row.market) ?? { correct: 0, total: 0 };
    map.set(row.market, { correct: cur.correct + (row.correct ? 1 : 0), total: cur.total + 1 });
    fixtures.add(row.fixture_id);
  }

  const stats: AccuracyStat[] = Array.from(map.entries())
    .map(([market, { correct, total }]) => ({ market, correct, total, pct: Math.round((correct / total) * 100) }))
    .filter((s) => s.total >= 1)
    .sort((a, b) => b.total - a.total);

  return { stats, totalGames: fixtures.size, totalPredictions: rows.length };
}

export default async function StatsPage() {
  const { stats, totalGames, totalPredictions } = await getGlobalStats();

  const overall = stats.reduce((acc, s) => ({ correct: acc.correct + s.correct, total: acc.total + s.total }), { correct: 0, total: 0 });
  const overallPct = overall.total > 0 ? Math.round((overall.correct / overall.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-black text-white">Histórico de Acertos</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Previsões avaliadas nos jogos encerrados da Copa 2026</p>
      </div>

      {stats.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center space-y-3">
          <TrendingUp className="w-8 h-8 text-zinc-700 mx-auto" />
          <p className="text-sm text-zinc-500">Ainda não há jogos avaliados.</p>
          <p className="text-xs text-zinc-700">As estatísticas aparecem automaticamente após os jogos encerrarem.</p>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center space-y-1">
              <p className={`text-2xl font-black ${overallPct >= 60 ? "text-green-400" : overallPct >= 45 ? "text-yellow-400" : "text-red-400"}`}>
                {overallPct}%
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Acerto Geral</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Target className="w-4 h-4 text-blue-400" />
                <p className="text-2xl font-black text-white">{totalGames}</p>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Jogos</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <p className="text-2xl font-black text-white">{overall.correct}</p>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Acertos</p>
            </div>
          </div>

          {/* Stats por mercado */}
          <AccuracyStats stats={stats} />

          <p className="text-[10px] text-zinc-700 text-center">
            {totalPredictions} previsões avaliadas em {totalGames} jogos encerrados
          </p>
        </>
      )}
    </div>
  );
}
