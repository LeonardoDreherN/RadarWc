import type { BetLabel, H2HSummary, MatchAnalysis, RiskLevel } from "./analysis";

export async function analyzeMatchWithAI(
  home: string,
  away: string,
  fixtureId: number,
  h2hSummary: H2HSummary
): Promise<MatchAnalysis | null> {
  try {
    const prompt = `Você é um analista especializado em apostas esportivas da Copa do Mundo.
Analise o jogo ${home} vs ${away} na Copa do Mundo 2026 com base no seu conhecimento real sobre as seleções.

Avalie cada mercado e classifique o risco com base na confiança:
- "baixo": confiança > 65% — tendência forte, vale apostar
- "medio": confiança entre 31-65% — tendência moderada, avaliar
- "alto": confiança ≤ 30% — muito incerto, alto risco
- "nao_apostar": quando não há tendência clara ou dados contraditórios

Retorne APENAS JSON válido, sem markdown, sem explicações fora do JSON:
{
  "labels": [
    {
      "market": "Gols no Jogo",
      "suggestion": "Mais de 2.5 Gols" ou "Menos de 2.5 Gols",
      "confidence": número de 0 a 100,
      "basis": "Explicação objetiva em português com dados que você conhece sobre estes times",
      "totalGames": número estimado de jogos analisados,
      "hits": número estimado de acertos,
      "risk": "baixo" ou "medio" ou "alto" ou "nao_apostar"
    }
  ]
}

Analise TODOS estes mercados em português:
1. Gols no Jogo: "Mais de 2.5 Gols" ou "Menos de 2.5 Gols"
2. Ambas Marcam: "Sim — Ambas as equipes marcam" ou "Não — Pelo menos uma equipe não marca"
3. Gol no 1° Tempo: "Gol antes do intervalo — Provável" ou "Sem gol no 1° tempo — Mais provável"
4. Resultado: quem é favorito e por quê (ex: "${home} favorito ao triunfo")
5. Escanteios: "Mais de 9.5 escanteios" ou "Menos de 9.5 escanteios"
6. Cartões: "Mais de 3.5 cartões" ou "Menos de 3.5 cartões"

Base suas análises em: ranking FIFA, estilo de jogo, histórico recente, fase da Copa, nível dos atacantes e defensores de cada seleção.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
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
