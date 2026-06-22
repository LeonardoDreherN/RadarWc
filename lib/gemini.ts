import type { BetLabel, H2HSummary, MatchAnalysis, RiskLevel } from "./analysis";

export async function analyzeMatchWithAI(
  home: string,
  away: string,
  fixtureId: number,
  h2hSummary: H2HSummary,
  round?: string
): Promise<MatchAnalysis | null> {
  try {
    const phase = round ?? "Copa do Mundo 2026";
    const isKnockout = /round of|quarter|semi|final/i.test(phase);
    const isGroupStage = /group/i.test(phase);

    const prompt = `Você é um analista especializado em apostas esportivas da Copa do Mundo 2026.
Analise o jogo ${home} vs ${away} — ${phase}.

CONTEXTO DA FASE:
${isKnockout ? `- É jogo ELIMINATÓRIO. Ambas as equipes jogam com tudo, sem poupar. Isso tende a reduzir gols no tempo normal pois as equipes ficam mais cautelosas. Prorrogação e pênaltis são possíveis.` : ""}
${isGroupStage ? `- É jogo de FASE DE GRUPOS. Dependendo da situação na tabela, um time pode já estar classificado ou precisar vencer para avançar. Considere o nível de motivação de cada equipe.` : ""}
- Fase: ${phase}

MERCADOS OBRIGATÓRIOS (analise TODOS os 6 sempre):
1. Gols no Jogo: "Mais de 2.5 Gols" ou "Menos de 2.5 Gols"
2. Ambas Marcam: "Sim — Ambas as equipes marcam" ou "Não — Pelo menos uma não marca"
3. Gol no 1° Tempo: "Gol antes do intervalo — Provável" ou "Sem gol no 1° tempo — Mais provável"
4. Resultado Final: quem é favorito (ex: "${home} favorito ao triunfo", "Empate provável")
5. Escanteios: "Mais de 9.5 escanteios" ou "Menos de 9.5 escanteios"
6. Cartões: "Mais de 3.5 cartões" ou "Menos de 3.5 cartões"

MERCADOS EXTRAS (escolha de 2 a 4 que fazem sentido para ESTE jogo específico e adicione após os obrigatórios):
- Handicap Asiático: qual time tem vantagem clara
- Vencedor do 1° Tempo: quem lidera no intervalo
- Clean Sheet: "${home} não sofre gol" ou "${away} não sofre gol"
- Primeiro a Marcar: qual equipe tende a abrir o placar
- Mais de 1.5 Gols: jogo tende a ter pelo menos 2 gols
- Gols do ${home}: "Mais de 1.5" ou "Menos de 1.5"
- Gols do ${away}: "Mais de 1.5" ou "Menos de 1.5"
- Empate na partida: probabilidade real de empate neste confronto

INSTRUÇÕES:
- Os 6 mercados obrigatórios DEVEM sempre aparecer no JSON, sem exceção.
- Baseie em: ranking FIFA, estilo de jogo, histórico recente, fase da Copa, força ofensiva/defensiva conhecida de cada seleção, confrontos diretos históricos.
- Seja ESPECÍFICO: mencione características reais de cada seleção (ex: "Brasil tem forte pressão alta", "Argentina é sólida defensivamente com Di María").
- Classifique o risco:
  • "baixo": confiança > 65% — tendência forte, vale apostar
  • "medio": confiança entre 40-65% — tendência moderada, avaliar bem
  • "alto": confiança < 40% — muito incerto
  • "nao_apostar": dados contraditórios ou jogo muito imprevisível

Retorne APENAS JSON válido, sem markdown, sem texto fora do JSON:
{
  "labels": [
    {
      "market": "nome do mercado",
      "suggestion": "sugestão específica",
      "confidence": número de 0 a 100,
      "basis": "Explicação objetiva em português com dados reais sobre estes times neste contexto",
      "totalGames": número estimado de jogos relevantes analisados,
      "hits": número estimado de acertos históricos,
      "risk": "baixo" ou "medio" ou "alto" ou "nao_apostar"
    }
  ]
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.65,
        max_tokens: 2500,
      }),
    });

    if (!res.ok) {
      console.error("Groq error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const validRisks: RiskLevel[] = ["baixo", "medio", "alto", "nao_apostar"];

    const labels: BetLabel[] = (parsed.labels ?? [])
      .filter((l: BetLabel) => l.totalGames >= 1)
      .map((l: BetLabel) => ({
        ...l,
        risk: validRisks.includes(l.risk) ? l.risk : "alto",
      }))
      .sort((a: BetLabel, b: BetLabel) => b.confidence - a.confidence);

    return {
      fixtureId,
      home,
      away,
      labels,
      h2hSummary,
      isAiAnalysis: true,
    } as MatchAnalysis & { isAiAnalysis: boolean };
  } catch (e) {
    console.error("Groq error:", e);
    return null;
  }
}
