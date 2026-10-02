import styles from "./EntryCard.module.css";
import { calcTechnicalScore, formatTechnicalSummary } from "../constants/technicalCriteria";

const STATUS_COLORS = {
  "Assistido":      { bg: "rgba(34,197,94,0.15)",  text: "#86efac", border: "rgba(34,197,94,0.3)" },
  "Assistindo":     { bg: "rgba(59,130,246,0.15)", text: "#93c5fd", border: "rgba(59,130,246,0.3)" },
  "Quero assistir": { bg: "rgba(245,158,11,0.15)", text: "#fcd34d", border: "rgba(245,158,11,0.3)" },
};

export default function EntryCard({ entry, onEdit, onDelete }) {
  const statusStyle = STATUS_COLORS[entry.status] || {};

  // Suporte a formato antigo (string) e novo (array)
  const moods = Array.isArray(entry.moods)
    ? entry.moods
    : entry.mood
    ? [entry.mood]
    : [];

  // Suporte a formato antigo (string) e novo (array)
  const genres = Array.isArray(entry.genres)
    ? entry.genres
    : entry.genre
    ? [entry.genre]
    : [];

  const seriesData = entry.seriesData || null;

  // Capa oficial (poster vertical ou backdrop)
  const coverImg = seriesData?.poster || seriesData?.backdrop || null;

  // Nota TMDB
  const tmdbScore = seriesData?.voteAverage > 0
    ? seriesData.voteAverage
    : seriesData?.vote_average > 0
    ? seriesData.vote_average
    : null;

  // 1. Feeling: Nota atribuída pelo usuário (0 a 10, passo 0.5)
  const userRating = Number(entry.rating) > 0 ? Number(entry.rating) : null;

  // 2. Nota Técnica: Média aritmética dos 5 critérios (0 a 5, passo 0.5)
  const techScore = entry.technicalScore != null
    ? Number(entry.technicalScore)
    : calcTechnicalScore(entry.technicalRatings);
  const techSummary = formatTechnicalSummary(entry.technicalRatings);

  function formatRuntime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  return (
    <article className={styles.card}>
      {/* Capa da produção por completo + Notas */}
      {coverImg && (
        <div className={styles.coverContainer}>
          <div
            className={styles.coverBlurBg}
            style={{ backgroundImage: `url(${coverImg})` }}
            aria-hidden="true"
          />
          <img src={coverImg} alt={entry.title} className={styles.coverImg} />

          {/* Barra superior de notas sobre a capa */}
          <div className={styles.coverTopBar}>
            <div className={styles.coverRatingsLeft}>
              <div
                className={userRating ? styles.userRatingBadge : styles.userRatingBadgeEmpty}
                title={userRating ? `Feeling: ${userRating.toFixed(1)}/10` : "Você ainda não avaliou o feeling"}
              >
                <span className={userRating ? styles.userStar : styles.userStarEmpty}>⭐</span>
                <span className={styles.badgeName}>Feeling</span>
                <span className={userRating ? styles.userScore : styles.userScoreEmpty}>
                  {userRating ? `${userRating.toFixed(1)}` : "—"}
                </span>
              </div>

              {techScore != null && (
                <div
                  className={styles.techRatingBadge}
                  title={`Nota Técnica: ${techScore.toFixed(1)}/5 ${techSummary ? `(${techSummary})` : ""}`}
                >
                  <span className={styles.techIcon}>🎬</span>
                  <span className={styles.badgeName}>Técnica</span>
                  <span className={styles.techScore}>{techScore.toFixed(1)}</span>
                </div>
              )}
            </div>

            {tmdbScore != null && (
              <div className={styles.tmdbBadge} title={`Nota TMDB: ${Number(tmdbScore).toFixed(1)}/10`}>
                <span className={styles.tmdbLogo}>TMDB</span>
                <span className={styles.tmdbScore}>{Number(tmdbScore).toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Se não houver capa, exibe as notas no topo do card */}
      {!coverImg && (tmdbScore != null || userRating != null || techScore != null) && (
        <div className={styles.inlineRatings}>
          <div className={styles.coverRatingsLeft}>
            <div
              className={userRating ? styles.userRatingBadge : styles.userRatingBadgeEmpty}
              title={userRating ? `Feeling: ${userRating.toFixed(1)}/10` : "Você ainda não avaliou o feeling"}
            >
              <span className={userRating ? styles.userStar : styles.userStarEmpty}>⭐</span>
              <span className={styles.badgeName}>Feeling</span>
              <span className={userRating ? styles.userScore : styles.userScoreEmpty}>
                {userRating ? `${userRating.toFixed(1)}` : "—"}
              </span>
            </div>

            {techScore != null && (
              <div
                className={styles.techRatingBadge}
                title={`Nota Técnica: ${techScore.toFixed(1)}/5 ${techSummary ? `(${techSummary})` : ""}`}
              >
                <span className={styles.techIcon}>🎬</span>
                <span className={styles.badgeName}>Técnica</span>
                <span className={styles.techScore}>{techScore.toFixed(1)}</span>
              </div>
            )}
          </div>

          {tmdbScore != null && (
            <div className={styles.tmdbBadge} title={`Nota TMDB: ${Number(tmdbScore).toFixed(1)}/10`}>
              <span className={styles.tmdbLogo}>TMDB</span>
              <span className={styles.tmdbScore}>{Number(tmdbScore).toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.typeBadge}>
          {entry.type === "Filme" ? "🎥" : "📺"} {entry.type}
        </div>
        <div
          className={styles.statusBadge}
          style={{ background: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
        >
          {entry.status}
        </div>
      </div>

      <h3 className={styles.title}>{entry.title}</h3>

      {/* Informações de notas do usuário: Feeling & Técnica */}
      {(userRating != null || techScore != null) && (
        <div className={styles.twoRatingsRow}>
          <div
            className={styles.ratingChipFeeling}
            title="Feeling: Sua nota pessoal atribuída pelo coração (0 a 10)"
          >
            <span className={styles.ratingChipLabel}>💜 Feeling</span>
            <span className={styles.ratingChipValue}>
              {userRating != null ? `${userRating.toFixed(1)} / 10` : "s/ nota"}
            </span>
          </div>

          {techScore != null && (
            <div
              className={styles.ratingChipTech}
              title={`Nota Técnica: média dos critérios (${techSummary || "5 critérios"})`}
            >
              <span className={styles.ratingChipLabel}>🎬 Nota Técnica</span>
              <span className={styles.ratingChipValue}>
                {techScore.toFixed(1)} / 5 ★
              </span>
            </div>
          )}
        </div>
      )}

      {/* Info TMDB — filmes e séries */}
      {seriesData && (
        <div className={styles.seriesMeta}>
          {seriesData.status && (
            <span className={`${styles.seriesStatus} ${
              seriesData.status === "Em andamento" ? styles.statusActive :
              seriesData.status === "Lançado"      ? styles.statusReleased :
              styles.statusEnded
            }`}>
              {seriesData.status === "Em andamento" ? "🟢" :
               seriesData.status === "Lançado"      ? "✅" : "⚫"} {seriesData.status}
            </span>
          )}
          {/* Séries: temporadas e episódios */}
          {seriesData.totalSeasons > 0 && (
            <span className={styles.seriesStat}>📺 {seriesData.totalSeasons} temp. · {seriesData.totalEpisodes} ep.</span>
          )}
          {/* Filmes: duração */}
          {seriesData.runtime > 0 && (
            <span className={styles.seriesStat}>⏱ {formatRuntime(seriesData.runtime)}</span>
          )}
        </div>
      )}

      {genres.length > 0 && (
        <div className={styles.genresRow}>
          {genres.map((g, idx) => (
            <span key={idx} className={idx === 0 ? styles.genrePrimaryBadge : styles.genreSecondaryBadge}>
              {g}
            </span>
          ))}
          {entry.animationType && (
            <span
              className={styles.animationBadge}
              title={`Nicho de animação: ${entry.animationType}`}
            >
              🎨 {entry.animationType}
            </span>
          )}
        </div>
      )}

      {/* Humores: MoodFilm principal em destaque com tag do App e secundários na linha debaixo */}
      {moods.length > 0 && (() => {
        const primary = moods[0];
        const pEmoji = primary.split(" ")[0];
        const pLabel = primary.split(" ").slice(1).join(" ");
        const secondaries = moods.slice(1);

        return (
          <div className={styles.moodSection}>
            {/* Tag MoodFilm = [emoji] [label] destacando o sentimento principal */}
            <div
              className={styles.moodFilmTag}
              title={`Sentimento principal da obra: ${pLabel}`}
            >
              <span className={styles.moodFilmBrand}>MoodFilm</span>
              <span className={styles.moodFilmEquals}>=</span>
              <span className={styles.moodFilmEmoji}>{pEmoji}</span>
              <span className={styles.moodFilmLabel}>{pLabel}</span>
            </div>

            {/* Outros emojis aparecem na linha debaixo */}
            {secondaries.length > 0 && (
              <div className={styles.secondaryMoodsRow}>
                {secondaries.map((s, idx) => {
                  const sEmoji = s.split(" ")[0];
                  const sLabel = s.split(" ").slice(1).join(" ");
                  return (
                    <div key={idx} className={styles.secondaryMoodBadge} title={sLabel}>
                      <span className={styles.secondaryMoodEmoji}>{sEmoji}</span>
                      <span className={styles.secondaryMoodLabel}>{sLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {entry.review && (
        <p className={styles.review}>{entry.review}</p>
      )}

      <div className={styles.actions}>
        <button id={`btn-edit-${entry.id}`} className={styles.editBtn} onClick={onEdit}>
          ✏️ Editar
        </button>
        <button id={`btn-delete-${entry.id}`} className={styles.deleteBtn} onClick={onDelete}>
          🗑️ Excluir
        </button>
      </div>
    </article>
  );
}
