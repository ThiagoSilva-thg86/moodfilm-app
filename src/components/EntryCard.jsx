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

  return (
    <article className={styles.card}>
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

      {entry.genre && <span className={styles.genre}>{entry.genre}</span>}

      {entry.rating > 0 && (
        <div className={styles.ratingRow}>
          <StarRating value={entry.rating} />
          <span className={styles.ratingNum}>{entry.rating}/10</span>
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
