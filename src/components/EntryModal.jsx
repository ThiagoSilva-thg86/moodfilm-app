import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./EntryModal.module.css";
import SeriesInfo from "./SeriesInfo";
import { searchSeries, getSeriesDetails } from "../services/tmdbService";

const MAX_REVIEW = 500;

export default function EntryModal({ entry, genres, statusOptions, moodOptions, onSave, onClose }) {
  const [form, setForm] = useState({
    title: "",
    type: "Filme",
    genres: [],  // array ordenado — até 3 gêneros
    status: "Quero assistir",
    rating: 0,
    moods: [],   // array ordenado — índice 0 = humor principal (leva ⭐)
    review: "",
  });
  const [saving, setSaving] = useState(false);
  const [seriesData, setSeriesData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const debounceRef = useRef(null);
  const titleRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (entry) {
      // Compatibilidade com entradas antigas que tinham campo "mood" (string)
      let moods = [];
      if (Array.isArray(entry.moods)) moods = entry.moods;
      else if (entry.mood) moods = [entry.mood];

      // Compatibilidade com entradas antigas que tinham campo "genre" (string)
      let genres = [];
      if (Array.isArray(entry.genres)) genres = entry.genres;
      else if (entry.genre) genres = [entry.genre];

      setForm({
        title:  entry.title  || "",
        type:   entry.type   || "Filme",
        genres,
        status: entry.status || "Quero assistir",
        rating: entry.rating || 0,
        moods,
        review: entry.review || "",
      });
      // Restaurar dados TMDB se existirem
      if (entry.seriesData) setSeriesData(entry.seriesData);
    }
  }, [entry]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (
        titleRef.current && !titleRef.current.contains(e.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const doTmdbSearch = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setLoadingSearch(true);
    try {
      const res = await searchSeries(q);
      setSuggestions(res);
      setShowSuggestions(res.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleTitleChange(e) {
    const val = e.target.value;
    set("title", val);
    // Se for série, dispara busca TMDB com debounce
    if (form.type === "Série") {
      setSeriesData(null);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doTmdbSearch(val), 380);
    }
  }

  async function handleSuggestionSelect(series) {
    setShowSuggestions(false);
    setSuggestions([]);
    set("title", series.name);
    setLoadingDetails(true);
    try {
      const details = await getSeriesDetails(series.id);
      setSeriesData(details);
      // Preenche gêneros automaticamente se vazio
      if (form.genres.length === 0 && details.genres?.length > 0) {
        setForm((prev) => ({ ...prev, title: details.name, genres: details.genres.slice(0, 3) }));
      } else {
        setForm((prev) => ({ ...prev, title: details.name }));
      }
    } catch {
      setSeriesData(null);
    } finally {
      setLoadingDetails(false);
    }
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

  // Alterna seleção de gênero: adiciona no fim da fila (máx 3) ou remove se já estiver
  function toggleGenre(val) {
    setForm((prev) => {
      const genres = prev.genres;
      if (genres.includes(val)) {
        return { ...prev, genres: genres.filter((g) => g !== val) };
      }
      if (genres.length >= 3) return prev;
      return { ...prev, genres: [...genres, val] };
    });
  }

  // Quando uma série é selecionada no TMDB
  function handleSeriesSelect(data) {
    setSeriesData(data);
    setForm((prev) => ({
      ...prev,
      title: data.name,
      // Preenche gêneros automaticamente se ainda não tiver
      genres: prev.genres.length === 0 && data.genres?.length > 0
        ? data.genres.slice(0, 3)
        : prev.genres,
    }));
  }

  function handleSeriesClear() {
    setSeriesData(null);
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
      // Inclui dados do TMDB na entrada se houver
      await onSave({ ...form, seriesData: seriesData || null });
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
          {/* Title — quando Série, dispara busca TMDB */}
          <div className={styles.field} style={{ position: "relative" }}>
            <label htmlFor="modal-title">
              Título *
              {form.type === "Série" && (
                <span className={styles.tmdbHint}>
                  {loadingSearch ? " 🔍 buscando..." : loadingDetails ? " ⏳ carregando..." : " — comece a digitar para buscar"}
                </span>
              )}
            </label>
            <input
              ref={titleRef}
              id="modal-title"
              type="text"
              placeholder={form.type === "Série" ? "Digite o nome da série..." : "Nome do filme ou série"}
              value={form.title}
              onChange={handleTitleChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              required
              autoFocus
              autoComplete="off"
            />

            {/* Dropdown de sugestões TMDB */}
            {showSuggestions && suggestions.length > 0 && (
              <ul ref={suggestionsRef} className={styles.tmdbDropdown} role="listbox">
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    className={styles.tmdbOption}
                    role="option"
                    onMouseDown={(e) => { e.preventDefault(); handleSuggestionSelect(s); }}
                  >
                    {s.poster
                      ? <img src={s.poster} alt={s.name} className={styles.tmdbPoster} />
                      : <div className={styles.tmdbPosterPlaceholder}>📺</div>
                    }
                    <div className={styles.tmdbOptionInfo}>
                      <span className={styles.tmdbName}>{s.name}</span>
                      {s.year && <span className={styles.tmdbYear}>{s.year}</span>}
                      {s.overview && <span className={styles.tmdbOverview}>{s.overview.slice(0, 80)}…</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Painel de info da série selecionada */}
            {seriesData && <SeriesInfo data={seriesData} />}
          </div>

          {/* Type row */}
          <div className={styles.field}>
            <label htmlFor="modal-type">Tipo</label>
            <select id="modal-type" value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
              <option value="Filme">🎥 Filme</option>
              <option value="Série">📺 Série</option>
            </select>
          </div>

          {/* Genres — múltipla seleção até 3 */}
          <div className={styles.field}>
            <div className={styles.moodLabelRow}>
              <label>Gênero(s)</label>
              <span className={styles.moodCount}>
                {form.genres.length === 0
                  ? "Selecione até 3 gêneros"
                  : `${form.genres.length}/3 selecionado${form.genres.length > 1 ? "s" : ""}`}
              </span>
            </div>
            <div className={styles.genreGrid}>
              {genres.map((g) => {
                const selected = form.genres.includes(g);
                const isPrimary = form.genres[0] === g;
                const isDisabled = !selected && form.genres.length >= 3;
                return (
                  <button
                    key={g}
                    type="button"
                    id={`modal-genre-${g.replace(/\s/g, "-").toLowerCase()}`}
                    className={[
                      styles.genreBtn,
                      selected    ? styles.genreSelected  : "",
                      isPrimary   ? styles.genrePrimary   : "",
                      isDisabled  ? styles.genreDisabled  : "",
                    ].join(" ")}
                    onClick={() => !isDisabled && toggleGenre(g)}
                    title={isDisabled ? "Máximo de 3 gêneros" : g}
                    aria-pressed={selected}
                  >
                    {g}
                  </button>
                );
              })}
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
