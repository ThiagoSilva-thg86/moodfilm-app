import styles from "./EntryCard.module.css";

const STATUS_COLORS = {
  "Assistido":      { bg: "rgba(34,197,94,0.15)",  text: "#86efac", border: "rgba(34,197,94,0.3)" },
  "Assistindo":     { bg: "rgba(59,130,246,0.15)", text: "#93c5fd", border: "rgba(59,130,246,0.3)" },
  "Quero assistir": { bg: "rgba(245,158,11,0.15)", text: "#fcd34d", border: "rgba(245,158,11,0.3)" },
};

function StarRating({ value }) {
  return (
    <div className={styles.stars} aria-label={`Nota ${value} de 10`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={i < value ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </div>
  );
}

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

  // Nota TMDB e do Usuário
  const tmdbScore = seriesData?.voteAverage > 0
    ? seriesData.voteAverage
    : seriesData?.vote_average > 0
    ? seriesData.vote_average
    : null;

  const userRating = entry.rating > 0 ? entry.rating : null;

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

          {/* Badges de notas sobrepostos na vertical (⭐ em cima, TMDB embaixo) */}
          <div className={styles.coverRatings}>
            <div
              className={userRating ? styles.userRatingBadge : styles.userRatingBadgeEmpty}
              title={userRating ? `Sua nota: ${userRating}/10` : "Você ainda não avaliou"}
            >
              <span className={userRating ? styles.userStar : styles.userStarEmpty}>⭐</span>
              <span className={userRating ? styles.userScore : styles.userScoreEmpty}>
                {userRating ? `${userRating}/10` : "s/ nota"}
              </span>
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

      {/* Se não houver capa, exibe as notas no corpo do card */}
      {!coverImg && (tmdbScore != null || userRating != null) && (
        <div className={styles.inlineRatings}>
          <div
            className={userRating ? styles.userRatingBadge : styles.userRatingBadgeEmpty}
            title={userRating ? `Sua nota: ${userRating}/10` : "Você ainda não avaliou"}
          >
            <span className={userRating ? styles.userStar : styles.userStarEmpty}>⭐</span>
            <span className={userRating ? styles.userScore : styles.userScoreEmpty}>
              {userRating ? `${userRating}/10` : "s/ nota"}
            </span>
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
        </div>
      )}

      {moods.length > 0 && (
        <div className={styles.moodsRow}>
          {moods.map((mood, idx) => {
            const emoji = mood.split(" ")[0];
            const label = mood.split(" ").slice(1).join(" ");
            const isPrimary = idx === 0;
            return (
              <div
                key={idx}
                className={isPrimary ? styles.moodPrimary : styles.moodSecondary}
                title={label}
              >
                {isPrimary && <span className={styles.moodStar}>⭐</span>}
                <span className={styles.moodEmoji}>{emoji}</span>
                {isPrimary && (
                  <span className={styles.moodLabel}>{label}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

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
