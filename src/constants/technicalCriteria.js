// Critérios de Avaliação Técnica do MoodFilm (escala de 0 a 5 estrelas, passo de 0.5)
export const TECHNICAL_CRITERIA = [
  {
    key: "script",
    label: "Roteiro e História (Enredo)",
    icon: "📝",
    desc: "Estrutura narrativa, diálogos, desenvolvimento e coerência",
  },
  {
    key: "acting",
    label: "Atuação (Elenco)",
    icon: "🎭",
    desc: "Performances, química dos personagens e expressividade",
  },
  {
    key: "direction",
    label: "Direção e Ritmo",
    icon: "🎬",
    desc: "Visão do diretor, cadência das cenas e condução da história",
  },
  {
    key: "technical",
    label: "Aspectos Técnicos (Fotografia e Cenografia)",
    icon: "🎥",
    desc: "Iluminação, enquadramento, figurino e design de produção",
  },
  {
    key: "soundtrack",
    label: "Trilha Sonora e Edição (Montagem)",
    icon: "🎵",
    desc: "Trilha musical, efeitos sonoros, cortes e transições",
  },
];

/**
 * Calcula a média técnica com base nos critérios avaliados (> 0)
 * Retorna número float com 1 casa decimal (ex: 4.5) ou null se nenhum critério foi avaliado.
 */
export function calcTechnicalScore(ratings) {
  if (!ratings || typeof ratings !== "object") return null;
  const values = TECHNICAL_CRITERIA
    .map((c) => Number(ratings[c.key]) || 0)
    .filter((v) => v > 0);

  if (values.length === 0) return null;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Number((sum / values.length).toFixed(1));
}

/**
 * Formata nota: se for número inteiro (ex: 4 ou 10), exibe sem casas decimais ("4", "10").
 * Se tiver fração (ex: 4.5 ou 9.5), exibe com 1 casa decimal ("4.5", "9.5").
 */
export function formatScore(num) {
  if (num == null || num === "" || isNaN(num)) return "";
  const val = Number(num);
  return Number.isInteger(val) ? String(val) : val.toFixed(1);
}

/**
 * Retorna um texto resumido com as notas dos critérios para exibição em tooltips
 */
export function formatTechnicalSummary(ratings) {
  if (!ratings || typeof ratings !== "object") return "";
  return TECHNICAL_CRITERIA
    .map((c) => {
      const val = Number(ratings[c.key]) || 0;
      return val > 0 ? `${c.icon} ${c.label.split(" ")[0]}: ${formatScore(val)}` : null;
    })
    .filter(Boolean)
    .join(" · ");
}
