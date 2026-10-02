import { useState, useEffect } from "react";
import styles from "./EntryModal.module.css";

const MAX_REVIEW = 500;

export default function EntryModal({ entry, genres, statusOptions, moodOptions, onSave, onClose }) {
  const [form, setForm] = useState({
    title: "",
    type: "Filme",
    genre: "",
    status: "Quero assistir",
    rating: 0,
    moods: [],   // array ordenado — índice 0 = humor principal (leva ⭐)
    review: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      // Compatibilidade com entradas antigas que tinham campo "mood" (string)
      let moods = [];
      if (Array.isArray(entry.moods)) moods = entry.moods;
      else if (entry.mood) moods = [entry.mood];

      setForm({
        title:  entry.title  || "",
        type:   entry.type   || "Filme",
        genre:  entry.genre  || "",
        status: entry.status || "Quero assistir",
        rating: entry.rating || 0,
        moods,
        review: entry.review || "",
      });
    }
  }, [entry]);

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  // Alterna seleção de humor: adiciona no fim da fila (máx 3) ou remove se já estiver
  function toggleMood(val) {
    setForm((prev) => {
      const moods = prev.moods;
      if (moods.includes(val)) {
        return { ...prev, moods: moods.filter((m) => m !== val) };
      }
      if (moods.length >= 3) return prev; // limite de 3
      return { ...prev, moods: [...moods, val] };
    });
  }

  function getMoodOrder(val) {
    const idx = form.moods.indexOf(val);
    return idx; // -1 = não selecionado, 0 = principal, 1/2 = secundários
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      setSaving(true);
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  const reviewLeft = MAX_REVIEW - form.review.length;
  const reviewNearLimit = reviewLeft <= 50;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={entry ? "Editar entrada" : "Nova entrada"}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {entry ? "✏️ Editar" : "➕ Adicionar"} {form.type}
          </h2>
          <button id="btn-modal-close" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Title */}
          <div className={styles.field}>
            <label htmlFor="modal-title">Título *</label>
            <input
              id="modal-title"
              type="text"
              placeholder="Nome do filme ou série"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Type & Genre row */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="modal-type">Tipo</label>
              <select id="modal-type" value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="Filme">🎥 Filme</option>
                <option value="Série">📺 Série</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="modal-genre">Gênero</label>
              <select id="modal-genre" value={form.genre} onChange={(e) => set("genre", e.target.value)}>
                <option value="">Selecionar...</option>
                {genres.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Status */}
          <div className={styles.field}>
            <label>Status</label>
            <div className={styles.statusGroup}>
              {statusOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  id={`modal-status-${s.replace(/\s/g, "-").toLowerCase()}`}
                  className={`${styles.statusBtn} ${form.status === s ? styles.statusActive : ""}`}
                  onClick={() => set("status", s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className={styles.field}>
            <label>Nota: <strong>{form.rating > 0 ? `${form.rating}/10` : "Sem nota"}</strong></label>
            <div className={styles.starPicker}>
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  id={`modal-star-${i + 1}`}
                  className={`${styles.starBtn} ${i < form.rating ? styles.starOn : ""}`}
                  onClick={() => set("rating", form.rating === i + 1 ? 0 : i + 1)}
                  aria-label={`Nota ${i + 1}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Mood — múltipla seleção até 3 */}
          <div className={styles.field}>
            <div className={styles.moodLabelRow}>
              <label>Como me senti?</label>
              <span className={styles.moodCount}>
                {form.moods.length === 0
                  ? "Selecione até 3 — o 1º ganha ⭐"
                  : `${form.moods.length}/3 selecionado${form.moods.length > 1 ? "s" : ""}`}
              </span>
            </div>
            <div className={styles.moodGrid}>
              {moodOptions.map((m) => {
                const val = `${m.emoji} ${m.label}`;
                const order = getMoodOrder(val); // -1, 0, 1 ou 2
                const selected = order !== -1;
                const isPrimary = order === 0;
                const isDisabled = !selected && form.moods.length >= 3;

                return (
                  <button
                    key={m.label}
                    type="button"
                    id={`modal-mood-${m.label.replace(/\s/g, "-").toLowerCase()}`}
                    className={[
                      styles.moodBtn,
                      selected   ? styles.moodSelected  : "",
                      isPrimary  ? styles.moodPrimary   : "",
                      isDisabled ? styles.moodDisabled  : "",
                    ].join(" ")}
                    onClick={() => !isDisabled && toggleMood(val)}
                    title={isDisabled ? "Máximo de 3 humores" : m.label}
                    aria-pressed={selected}
                  >
                    {isPrimary && (
                      <span className={styles.moodStarBadge} title="Humor principal">⭐</span>
                    )}
                    {selected && !isPrimary && (
                      <span className={styles.moodOrderBadge}>{order + 1}</span>
                    )}
                    <span className={styles.moodEmoji}>{m.emoji}</span>
                    <span className={styles.moodText}>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review com contador */}
          <div className={styles.field}>
            <div className={styles.reviewLabelRow}>
              <label htmlFor="modal-review">Resenha pessoal</label>
              <span
                className={`${styles.charCounter} ${reviewNearLimit ? styles.charCounterWarn : ""}`}
              >
                {reviewLeft} caracteres restantes
              </span>
            </div>
            <textarea
              id="modal-review"
              placeholder="O que você achou? (opcional)"
              value={form.review}
              onChange={(e) => set("review", e.target.value)}
              maxLength={MAX_REVIEW}
              rows={3}
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" id="btn-modal-cancel" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" id="btn-modal-save" className={styles.saveBtn} disabled={saving || !form.title.trim()}>
              {saving ? "Salvando..." : entry ? "Salvar alterações" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
