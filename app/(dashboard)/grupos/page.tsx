import Image from "next/image";
import { getStandings } from "@/lib/football-api";
import { LayoutGrid } from "lucide-react";

export const revalidate = 300;

const GROUP_LABELS: Record<string, string> = {
  GROUP_A: "Grupo A", GROUP_B: "Grupo B", GROUP_C: "Grupo C",
  GROUP_D: "Grupo D", GROUP_E: "Grupo E", GROUP_F: "Grupo F",
  GROUP_G: "Grupo G", GROUP_H: "Grupo H", GROUP_I: "Grupo I",
  GROUP_J: "Grupo J", GROUP_K: "Grupo K", GROUP_L: "Grupo L",
};

function formColor(char: string) {
  if (char === "W") return "bg-green-500/20 text-green-400";
  if (char === "L") return "bg-red-500/20 text-red-400";
  return "bg-zinc-700/60 text-zinc-400";
}

export default async function GruposPage() {
  const groups = await getStandings();

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
        <LayoutGrid className="w-10 h-10 text-zinc-700" />
        <p className="text-zinc-300 font-bold">Tabelas em breve</p>
        <p className="text-zinc-600 text-sm max-w-xs">
          As tabelas de classificação aparecem após o início da fase de grupos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Fase de Grupos</h1>

      {groups.map((g) => (
        <div key={g.group} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/80 overflow-hidden">
          {/* Cabeçalho do grupo */}
          <div className="px-4 py-2.5 bg-zinc-800/40 border-b border-zinc-800/60">
            <h2 className="text-xs font-black text-white uppercase tracking-wider">
              {GROUP_LABELS[g.group] ?? g.group}
            </h2>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-600 border-b border-zinc-800/40">
                  <th className="px-4 py-2 text-left font-medium w-6">#</th>
                  <th className="px-2 py-2 text-left font-medium">Time</th>
                  <th className="px-2 py-2 text-center font-medium">PJ</th>
                  <th className="px-2 py-2 text-center font-medium">V</th>
                  <th className="px-2 py-2 text-center font-medium">E</th>
                  <th className="px-2 py-2 text-center font-medium">D</th>
                  <th className="px-2 py-2 text-center font-medium">SG</th>
                  <th className="px-2 py-2 text-center font-medium">Pts</th>
                  <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Forma</th>
                </tr>
              </thead>
              <tbody>
                {g.table.map((row, i) => (
                  <tr
                    key={row.team.id}
                    className={`border-b border-zinc-800/30 last:border-0 transition-colors hover:bg-zinc-800/30 ${
                      i < 2 ? "bg-green-500/3" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-black ${i < 2 ? "text-green-400" : "text-zinc-500"}`}>
                        {row.position}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        {row.team.crest ? (
                          <div className="w-5 h-5 relative shrink-0">
                            <Image src={row.team.crest} alt={row.team.name} fill className="object-contain" sizes="20px" />
                          </div>
                        ) : null}
                        <span className="text-zinc-200 font-semibold truncate max-w-[100px]">{row.team.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center text-zinc-400">{row.playedGames}</td>
                    <td className="px-2 py-2.5 text-center text-zinc-400">{row.won}</td>
                    <td className="px-2 py-2.5 text-center text-zinc-400">{row.draw}</td>
                    <td className="px-2 py-2.5 text-center text-zinc-400">{row.lost}</td>
                    <td className="px-2 py-2.5 text-center text-zinc-400">
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="font-black text-white">{row.points}</span>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <div className="flex gap-0.5">
                        {(row.form ?? "").split("").map((c, fi) => (
                          <span key={fi} className={`w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-black ${formColor(c)}`}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legenda */}
          <div className="px-4 py-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-green-500/40" />
            <span className="text-[10px] text-zinc-600">Avançam para as oitavas</span>
          </div>
        </div>
      ))}
    </div>
  );
}
