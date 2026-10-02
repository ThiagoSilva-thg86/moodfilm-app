import styles from "./MovieInfo.module.css";

/**
 * Exibe as informações do filme buscado no TMDB
 * Props:
 *   data — objeto retornado por getMovieDetails()
 */
export default function MovieInfo({ data }) {
  if (!data) return null;

  function formatRuntime(minutes) {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        {data.poster && (
          <img src={data.poster} alt={data.name} className={styles.poster} />
        )}
        <div className={styles.mainInfo}>
          <div className={styles.topRow}>
            <h4 className={styles.movieName}>{data.name}</h4>
            {data.year && <span className={styles.year}>{data.year}</span>}
          </div>

          {data.tagline && (
            <p className={styles.tagline}>"{data.tagline}"</p>
          )}

          <div className={styles.statsRow}>
            {data.runtime > 0 && (
              <div className={styles.stat}>
                <span className={styles.statNum}>{formatRuntime(data.runtime)}</span>
                <span className={styles.statLabel}>duração</span>
              </div>
            )}
            {data.status && (
              <div className={styles.stat}>
                <span className={styles.statNum}>
                  {data.status === "Lançado" ? "✅" : "🎬"} {data.status}
                </span>
                <span className={styles.statLabel}>status</span>
              </div>
            )}
          </div>

          {data.overview && (
            <p className={styles.overview}>{data.overview}</p>
          )}
        </div>
      </div>
    </div>
  );
}
