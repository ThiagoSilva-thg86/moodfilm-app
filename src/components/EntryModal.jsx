import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./EntryModal.module.css";
import SeriesInfo from "./SeriesInfo";
import MovieInfo from "./MovieInfo";
import { searchSeries, getSeriesDetails, searchMovies, getMovieDetails } from "../services/tmdbService";
import { TECHNICAL_CRITERIA, calcTechnicalScore, formatScore } from "../constants/technicalCriteria";

const MAX_REVIEW = 500;

export const ANIMATION_TYPES = [
  {
    id: "2D",
    name: "2D",
    fullName: "2D - Tradicional / Anime / 2D Autoral",
    desc: "Tradicional · Anime · 2D Autoral",
  },
  {
    id: "2.5D",
    name: "2.5D",
    fullName: "2.5D - Híbrido / NPR (Non-Photorealistic Rendering)",
    desc: "Híbrido · NPR (Non-Photorealistic)",
  },
  {
    id: "3D",
    name: "3D",
    fullName: "3D - CGI Ocidental / 3D Estilizado",
    desc: "CGI Ocidental · 3D Estilizado",
  },
];

export default function EntryModal({ entry, genres, statusOptions, moodOptions, onSave, onClose }) {
  const [form, setForm] = useState({
    title: "",
    type: "Filme",
    genres: [],  // array ordenado — até 3 gêneros
    status: "Quero assistir",
    rating: 0,   // Feeling: 0 a 10 com passo 0.5
    technicalRatings: {
      script: 0,
      acting: 0,
      direction: 0,
      technical: 0,
      soundtrack: 0,
    },
    moods: [],   // array ordenado — índice 0 = humor principal (leva ⭐)
    review: "",
    animationType: "", // 2D, 2.5D ou 3D
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
  const typeRef = useRef("Filme"); // ref para evitar stale closure no handleTitleChange

  // Gêneros disponíveis: inclui padrões + existentes da entrada + importados do TMDB
  const [availableGenres, setAvailableGenres] = useState(() => {
    const set = new Set(genres || []);
    if (entry) {
      const eg = Array.isArray(entry.genres) ? entry.genres : entry.genre ? [entry.genre] : [];
      eg.forEach((g) => g && set.add(g));
    }
    return Array.from(set);
  });

  useEffect(() => {
    if (genres && genres.length > 0) {
      setAvailableGenres((prev) => Array.from(new Set([...prev, ...genres])));
    }
  }, [genres]);

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

      const rawTech = entry.technicalRatings || {};

      setForm({
        title:  entry.title  || "",
        type:   entry.type   || "Filme",
        genres,
        status: entry.status || "Quero assistir",
        rating: entry.rating != null ? Number(entry.rating) : 0,
        technicalRatings: {
          script: Number(rawTech.script) || 0,
          acting: Number(rawTech.acting) || 0,
          direction: Number(rawTech.direction) || 0,
          technical: Number(rawTech.technical) || 0,
          soundtrack: Number(rawTech.soundtrack) || 0,
        },
        moods,
        review: entry.review || "",
        animationType: entry.animationType || "",
      });
      // Restaurar dados TMDB se existirem
      if (entry.seriesData) setSeriesData(entry.seriesData);
      if (entry.type) typeRef.current = entry.type;
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

  const doTmdbSearch = useCallback(async (q, type) => {
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setLoadingSearch(true);
    try {
      const res = type === "Série" ? await searchSeries(q) : await searchMovies(q);
      setSuggestions(res);
      setShowSuggestions(res.length > 0);
    } catch (err) {
      console.error("[TMDB] Erro na busca:", err);
      setSuggestions([]);
      setShowSuggestions(false);
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
    // Usa typeRef para evitar stale closure — busca filmes ou séries
    if (typeRef.current === "Série" || typeRef.current === "Filme") {
      setSeriesData(null);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doTmdbSearch(val, typeRef.current), 380);
    }
  }

  function handleTypeChange(newType) {
    typeRef.current = newType;
    set("type", newType);
    setSeriesData(null);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleSuggestionSelect(item) {
    setShowSuggestions(false);
    setSuggestions([]);
    set("title", item.name);
    setLoadingDetails(true);
    try {
      const details = typeRef.current === "Série"
        ? await getSeriesDetails(item.id)
        : await getMovieDetails(item.id);
      setSeriesData(details);
      // Adiciona novos gêneros à lista disponível para seleção
      if (details.genres && details.genres.length > 0) {
        setAvailableGenres((prev) => Array.from(new Set([...prev, ...details.genres])));
      }
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
        return {
          ...prev,
          genres: genres.filter((g) => g !== val),
          animationType: val === "Animação" ? "" : prev.animationType,
        };
      }
      if (genres.length >= 3) return prev;
      return { ...prev, genres: [...genres, val] };
    });
  }

  // Quando uma série é selecionada no TMDB
  function handleSeriesSelect(data) {
    if (data.genres && data.genres.length > 0) {
      setAvailableGenres((prev) => Array.from(new Set([...prev, ...data.genres])));
    }
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

  function setTechRating(key, value) {
    const num = Math.max(0, Math.min(5, Math.round(Number(value) * 2) / 2));
    setForm((prev) => ({
      ...prev,
      technicalRatings: {
        ...prev.technicalRatings,
        [key]: num,
      },
    }));
  }

  function resetTechRatings() {
    setForm((prev) => ({
      ...prev,
      technicalRatings: {
        script: 0,
        acting: 0,
        direction: 0,
        technical: 0,
        soundtrack: 0,
      },
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      setSaving(true);
      const techScore = calcTechnicalScore(form.technicalRatings);
      // Inclui dados do TMDB e dados de avaliação técnica
      await onSave({
        ...form,
        rating: Number(form.rating) || 0,
        technicalRatings: form.technicalRatings,
        technicalScore: techScore,
        seriesData: seriesData || null,
      });
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
          {/* Title — busca TMDB para Filme e Série */}
          <div className={styles.field} style={{ position: "relative" }}>
            <label htmlFor="modal-title">
              Título *
              <span className={styles.tmdbHint}>
                {loadingSearch ? " 🔍 buscando..." : loadingDetails ? " ⏳ carregando..." : " — comece a digitar para buscar"}
              </span>
            </label>
            <input
              ref={titleRef}
              id="modal-title"
              type="text"
              placeholder={form.type === "Série" ? "Digite o nome da série..." : "Digite o nome do filme..."}
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
                      : <div className={styles.tmdbPosterPlaceholder}>{form.type === "Série" ? "📺" : "🎥"}</div>
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

            {/* Painel de info após seleção: MovieInfo para filmes, SeriesInfo para séries */}
            {seriesData && form.type === "Série" && <SeriesInfo data={seriesData} />}
            {seriesData && form.type === "Filme" && <MovieInfo data={seriesData} />}
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
              {availableGenres.map((g) => {
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

          {/* Sub-área para nicho/tipo de animação — abre automaticamente quando Animação está selecionada */}
          {form.genres.includes("Animação") && (
            <div className={styles.animationField}>
              <div className={styles.animationHeader}>
                <label className={styles.animationLabel}>
                  🎨 Nicho / Tipo de Animação
                </label>
                <span className={styles.animationHint}>
                  {form.animationType ? `${form.animationType} selecionado` : "Opcional — selecione o estilo"}
                </span>
              </div>
              <div className={styles.animationGrid}>
                {ANIMATION_TYPES.map((type) => {
                  const isSelected = form.animationType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      id={`modal-anim-${type.id.replace(".", "-")}`}
                      className={`${styles.animationCard} ${isSelected ? styles.animationCardActive : ""}`}
                      onClick={() => set("animationType", isSelected ? "" : type.id)}
                      title={type.fullName}
                    >
                      <div className={styles.animationCardHeader}>
                        <span className={styles.animationTag}>{type.name}</span>
                        <span className={styles.animationCheck}>{isSelected ? "✓" : "+"}</span>
                      </div>
                      <div className={styles.animationSubtypes}>{type.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1. FEELING (Nota do usuário de 0 a 10, passo de 0.5) */}
          <div className={styles.field}>
            <div className={styles.ratingHeader}>
              <label htmlFor="modal-feeling-slider" className={styles.ratingTitleLabel}>
                💜 Feeling (Sua Nota):{" "}
                <strong className={styles.feelingScoreValue}>
                  {form.rating > 0 ? `${formatScore(form.rating)} / 10` : "Sem nota"}
                </strong>
              </label>
              {form.rating > 0 && (
                <button
                  type="button"
                  id="modal-feeling-clear"
                  className={styles.clearBtnSmall}
                  onClick={() => set("rating", 0)}
                  title="Remover nota de feeling"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Estrelas visuais para o Feeling (10 estrelas com suporte a meia estrela) */}
            <div className={styles.feelingStarsRow} aria-label="Visualização em estrelas">
              {Array.from({ length: 10 }, (_, i) => {
                const starVal = i + 1;
                const isFull = form.rating >= starVal;
                const isHalf = form.rating === starVal - 0.5;
                return (
                  <button
                    key={i}
                    type="button"
                    id={`modal-feeling-star-${starVal}`}
                    className={`${styles.starVisualBtn} ${
                      isFull ? styles.starFull : isHalf ? styles.starHalf : styles.starEmpty
                    }`}
                    onClick={() => {
                      if (form.rating === starVal) set("rating", starVal - 0.5);
                      else if (form.rating === starVal - 0.5) set("rating", 0);
                      else set("rating", starVal);
                    }}
                    title={`Nota ${starVal}`}
                  >
                    ★
                  </button>
                );
              })}
            </div>

            {/* Slider de alta precisão 0 a 10 com passo 0.5 */}
            <div className={styles.sliderControlRow}>
              <button
                type="button"
                id="modal-feeling-minus"
                className={styles.stepperBtn}
                onClick={() => set("rating", Math.max(0, Number((form.rating - 0.5).toFixed(1))))}
                disabled={form.rating <= 0}
                title="Diminuir 0.5"
              >
                -0.5
              </button>
              <input
                id="modal-feeling-slider"
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={form.rating}
                onChange={(e) => set("rating", parseFloat(e.target.value))}
                className={styles.ratingSlider}
              />
              <button
                type="button"
                id="modal-feeling-plus"
                className={styles.stepperBtn}
                onClick={() => set("rating", Math.min(10, Number((form.rating + 0.5).toFixed(1))))}
                disabled={form.rating >= 10}
                title="Aumentar 0.5"
              >
                +0.5
              </button>
            </div>

            {/* Atalhos para notas fracionadas comuns */}
            <div className={styles.presetChips}>
              <span className={styles.presetLabel}>Atalhos:</span>
              {[5.0, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  id={`modal-feeling-preset-${String(val).replace(".", "-")}`}
                  className={`${styles.presetChip} ${form.rating === val ? styles.presetChipActive : ""}`}
                  onClick={() => set("rating", val)}
                >
                  {formatScore(val)}
                </button>
              ))}
            </div>
          </div>

          {/* 2. CRITÉRIOS DE AVALIAÇÃO TÉCNICA (0 a 5 estrelas, passo 0.5) */}
          <div className={styles.technicalBox}>
            <div className={styles.technicalHeader}>
              <div className={styles.technicalTitleGroup}>
                <label className={styles.technicalLabel}>
                  🎬 Avaliação Técnica (5 Critérios)
                </label>
                <span className={styles.technicalAverageBadge}>
                  {(() => {
                    const score = calcTechnicalScore(form.technicalRatings);
                    return score != null
                      ? `Nota Técnica: ${formatScore(score)} / 5 ★`
                      : "Nota Técnica: Sem notas";
                  })()}
                </span>
              </div>
              <button
                type="button"
                id="modal-tech-reset"
                className={styles.clearBtnSmall}
                onClick={resetTechRatings}
                title="Zerar todos os critérios técnicos"
              >
                Zerar critérios
              </button>
            </div>
            <p className={styles.technicalHint}>
              Escala de 0 a 5 estrelas (passo 0.5). A Nota Técnica é calculada automaticamente como a média dos critérios avaliados.
            </p>

            <div className={styles.criteriaList}>
              {TECHNICAL_CRITERIA.map((criterion) => {
                const currentVal = Number(form.technicalRatings[criterion.key]) || 0;
                return (
                  <div key={criterion.key} className={styles.criterionRow}>
                    <div className={styles.criterionInfo}>
                      <span className={styles.criterionName}>
                        {criterion.icon} {criterion.label}
                      </span>
                      <span className={styles.criterionScore}>
                        {currentVal > 0 ? `${formatScore(currentVal)} ★` : "—"}
                      </span>
                    </div>

                    <div className={styles.criterionControl}>
                      {/* Estrelas visuais 1 a 5 */}
                      <div className={styles.criterionStars}>
                        {Array.from({ length: 5 }, (_, i) => {
                          const starNum = i + 1;
                          const isFull = currentVal >= starNum;
                          const isHalf = currentVal === starNum - 0.5;
                          return (
                            <button
                              key={i}
                              type="button"
                              id={`modal-tech-${criterion.key}-star-${starNum}`}
                              className={`${styles.starVisualBtnSmall} ${
                                isFull ? styles.starFull : isHalf ? styles.starHalf : styles.starEmpty
                              }`}
                              onClick={() => {
                                if (currentVal === starNum) setTechRating(criterion.key, starNum - 0.5);
                                else if (currentVal === starNum - 0.5) setTechRating(criterion.key, 0);
                                else setTechRating(criterion.key, starNum);
                              }}
                              title={`${criterion.label}: ${starNum}`}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>

                      {/* Slider e steppers do critério */}
                      <div className={styles.criterionSliderWrap}>
                        <button
                          type="button"
                          id={`modal-tech-${criterion.key}-minus`}
                          className={styles.stepperBtnSmall}
                          onClick={() => setTechRating(criterion.key, currentVal - 0.5)}
                          disabled={currentVal <= 0}
                          title="-0.5"
                        >
                          -
                        </button>
                        <input
                          id={`modal-tech-${criterion.key}-slider`}
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={currentVal}
                          onChange={(e) => setTechRating(criterion.key, parseFloat(e.target.value))}
                          className={styles.criterionSlider}
                        />
                        <button
                          type="button"
                          id={`modal-tech-${criterion.key}-plus`}
                          className={styles.stepperBtnSmall}
                          onClick={() => setTechRating(criterion.key, currentVal + 0.5)}
                          disabled={currentVal >= 5}
                          title="+0.5"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
