import { useState } from "react";
import styles from "./SeriesInfo.module.css";

const STATUS_STYLE = {
  "Em andamento":  { color: "#86efac", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)" },
  "Encerrada":     { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
  "Cancelada":     { color: "#fca5a5", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)" },
  "Em produção":   { color: "#93c5fd", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)" },
};

/**
 * Exibe as informações da série buscada no TMDB
 * Props:
 *   data — objeto retornado por getSeriesDetails()
 */
export default function SeriesInfo({ data }) {
  const [expandedSeason, setExpandedSeason] = useState(null);

  if (!data) return null;

  const statusStyle = STATUS_STYLE[data.status] || { color: "#f1f5f9", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)" };

  return (
    <div className={styles.wrapper}>
      {/* Header: poster + info principal */}
      <div className={styles.header}>
        {data.poster && (
          <img src={data.poster} alt={data.name} className={styles.poster} />
        )}
        <div className={styles.mainInfo}>
          <div className={styles.topRow}>
            <h4 className={styles.seriesName}>{data.name}</h4>
            {data.year && <span className={styles.year}>{data.year}</span>}
          </div>

          <span
            className={styles.statusBadge}
            style={{ color: statusStyle.color, background: statusStyle.bg, borderColor: statusStyle.border }}
          >
            {data.status === "Em andamento" ? "🟢" : data.status === "Encerrada" ? "⚫" : "🔵"} {data.status}
          </span>

          <div className={styles.statsRow}>
            {data.voteAverage > 0 && (
              <div className={styles.stat}>
                <span className={styles.statNum}>⭐ {data.voteAverage.toFixed(1)}</span>
                <span className={styles.statLabel}>TMDB</span>
              </div>
            )}
            {data.totalSeasons > 0 && (
              <div className={styles.stat}>
                <span className={styles.statNum}>{data.totalSeasons}</span>
                <span className={styles.statLabel}>temporada{data.totalSeasons > 1 ? "s" : ""}</span>
              </div>
            )}
            {data.totalEpisodes > 0 && (
              <div className={styles.stat}>
                <span className={styles.statNum}>{data.totalEpisodes}</span>
                <span className={styles.statLabel}>episódio{data.totalEpisodes > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {data.overview && (
            <p className={styles.overview}>{data.overview}</p>
          )}
        </div>
      </div>

      {/* Temporadas e episódios */}
      {data.seasons && data.seasons.length > 0 && (
        <div className={styles.seasons}>
          <h5 className={styles.seasonsTitle}>📺 Temporadas</h5>
          {data.seasons.map((season) => (
            <div key={season.number} className={styles.seasonItem}>
              <button
                type="button"
                className={`${styles.seasonBtn} ${expandedSeason === season.number ? styles.seasonBtnOpen : ""}`}
                onClick={() => setExpandedSeason(expandedSeason === season.number ? null : season.number)}
              >
                <span className={styles.seasonName}>
                  {season.name || `Temporada ${season.number}`}
                </span>
                <span className={styles.seasonMeta}>
                  {season.episodeCount} ep.
                  <span className={styles.chevron}>{expandedSeason === season.number ? "▲" : "▼"}</span>
                </span>
              </button>

              {expandedSeason === season.number && season.episodes.length > 0 && (
                <ul className={styles.episodeList}>
                  {season.episodes.map((ep) => (
                    <li key={ep.number} className={styles.episode}>
                      <span className={styles.epNum}>E{String(ep.number).padStart(2, "0")}</span>
                      <span className={styles.epName}>{ep.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
