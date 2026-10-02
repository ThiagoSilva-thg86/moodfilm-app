import { useState, useRef, useEffect, useCallback } from "react";
import { searchSeries, getSeriesDetails } from "../services/tmdbService";
import styles from "./SeriesSearch.module.css";

/**
 * SeriesSearch — autocomplete de busca no TMDB com detalhes de temporadas/episódios
 * Props:
 *   onSelect(seriesData) — chamado quando o usuário seleciona uma série
 *   onClear() — chamado quando o campo é limpo
 *   initialName — nome inicial (ao editar)
 */
export default function SeriesSearch({ onSelect, onClear, initialName = "" }) {
  const [query, setQuery] = useState(initialName);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(!!initialName);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await searchSeries(q);
      setResults(res);
      setOpen(res.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    setSelected(false);
    if (onClear) onClear();
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  }

  async function handleSelect(series) {
    setOpen(false);
    setQuery(series.name);
    setSelected(true);
    setLoadingDetails(true);
    try {
      const details = await getSeriesDetails(series.id);
      onSelect(details);
    } catch (err) {
      console.error("Erro ao buscar detalhes:", err);
      // Passa dados básicos mesmo sem detalhes completos
      onSelect({
        id: series.id,
        name: series.name,
        year: series.year,
        poster: series.poster,
        overview: series.overview,
        status: "Desconhecido",
        totalSeasons: 0,
        totalEpisodes: 0,
        genres: [],
        seasons: [],
      });
    } finally {
      setLoadingDetails(false);
    }
  }

  function handleClear() {
    setQuery("");
    setSelected(false);
    setResults([]);
    setOpen(false);
    if (onClear) onClear();
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          id="series-search-input"
          type="text"
          className={styles.input}
          placeholder="Buscar série no TMDB..."
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loadingDetails && <span className={styles.spinner} title="Carregando dados..." />}
        {loading && !loadingDetails && <span className={styles.spinnerSm} />}
        {selected && !loadingDetails && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            title="Limpar seleção"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {open && (
        <ul className={styles.dropdown} role="listbox">
          {results.map((s) => (
            <li
              key={s.id}
              className={styles.option}
              role="option"
              onClick={() => handleSelect(s)}
            >
              {s.poster ? (
                <img src={s.poster} alt={s.name} className={styles.poster} />
              ) : (
                <div className={styles.posterPlaceholder}>📺</div>
              )}
              <div className={styles.optionInfo}>
                <span className={styles.optionName}>{s.name}</span>
                {s.year && <span className={styles.optionYear}>{s.year}</span>}
                {s.overview && (
                  <span className={styles.optionOverview}>
                    {s.overview.slice(0, 80)}…
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
