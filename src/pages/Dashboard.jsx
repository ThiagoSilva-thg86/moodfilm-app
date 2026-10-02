import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} from "../services/entriesService";
import EntryModal from "../components/EntryModal";
import EntryCard from "../components/EntryCard";
import Navbar from "../components/Navbar";
import styles from "./Dashboard.module.css";

const GENRES = ["Ação", "Comédia", "Drama", "Terror", "Romance", "Sci-Fi", "Animação", "Documentário", "Suspense", "Fantasia"];
const STATUS_OPTIONS = ["Quero assistir", "Assistindo", "Assistido"];
const MOOD_OPTIONS = [
  { emoji: "😭", label: "Chorei" },
  { emoji: "😂", label: "Ri muito" },
  { emoji: "😍", label: "Adorei" },
  { emoji: "😐", label: "Meh" },
  { emoji: "😬", label: "Tenso" },
  { emoji: "🤯", label: "Me surpreendeu" },
  { emoji: "😴", label: "Entediei" },
  { emoji: "🤩", label: "Obra-prima" },
  { emoji: "😨", label: "Deu medo" },
  { emoji: "😡", label: "Passei raiva" },
  { emoji: "🔥", label: "Fiquei eufórico" },
  { emoji: "💔", label: "Fiquei triste" },
  { emoji: "🌧️", label: "Bateu melancolia" },
  { emoji: "🤔", label: "Me fez pensar" },
  { emoji: "😱", label: "Levei um susto" },
  { emoji: "💪", label: "Saí motivado" },
];

function getCustomGenres() {
  try {
    const raw = localStorage.getItem("moodfilm_custom_genres");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomGenres(newGenres) {
  try {
    const existing = getCustomGenres();
    const merged = Array.from(new Set([...existing, ...newGenres]));
    localStorage.setItem("moodfilm_custom_genres", JSON.stringify(merged));
    return merged;
  } catch {
    return [];
  }
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filters, setFilters] = useState({ type: "all", status: "all", genre: "all", animationType: "all", mood: "all", search: "" });
  const [sortBy, setSortBy] = useState("newest");

  // Lista dinâmica de gêneros combinando os padrões, customizados e das entradas
  const allGenres = useMemo(() => {
    const set = new Set(GENRES);
    getCustomGenres().forEach((g) => g && set.add(g));
    entries.forEach((e) => {
      const list = Array.isArray(e.genres) ? e.genres : e.genre ? [e.genre] : [];
      list.forEach((g) => g && set.add(g));
    });
    return Array.from(set);
  }, [entries]);

  const loadEntries = useCallback(async () => {
    try {
      const data = await getUserEntries(currentUser.uid);
      setEntries(data);
    } catch (err) {
      console.error("Erro ao carregar entradas:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser.uid]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    let result = [...entries];
    if (filters.type !== "all") result = result.filter((e) => e.type === filters.type);
    if (filters.status !== "all") result = result.filter((e) => e.status === filters.status);
    if (filters.genre !== "all") result = result.filter((e) => {
      // Suporte a formato antigo (string) e novo (array)
      const genres = Array.isArray(e.genres) ? e.genres : e.genre ? [e.genre] : [];
      return genres.includes(filters.genre);
    });
    if (filters.animationType !== "all") {
      result = result.filter((e) => e.animationType === filters.animationType || e.animationType?.startsWith(filters.animationType));
    }
    if (filters.mood && filters.mood !== "all") {
      result = result.filter((e) => {
        const moods = Array.isArray(e.moods) ? e.moods : e.mood ? [e.mood] : [];
        return moods.some((m) => m === filters.mood || m.includes(filters.mood));
      });
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((e) => e.title.toLowerCase().includes(q));
    }
    if (sortBy === "rating") result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    else if (sortBy === "techScore") result.sort((a, b) => (Number(b.technicalScore) || 0) - (Number(a.technicalScore) || 0));
    else if (sortBy === "title") result.sort((a, b) => a.title.localeCompare(b.title));
    setFiltered(result);
  }, [entries, filters, sortBy]);

  async function handleSave(data) {
    if (data.genres && data.genres.length > 0) {
      saveCustomGenres(data.genres);
    }
    if (editingEntry) {
      await updateEntry(editingEntry.id, data);
    } else {
      await createEntry(currentUser.uid, data);
    }
    setModalOpen(false);
    setEditingEntry(null);
    loadEntries();
  }

  async function handleDelete(id) {
    if (window.confirm("Excluir esta entrada?")) {
      await deleteEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  }

  function openEdit(entry) {
    setEditingEntry(entry);
    setModalOpen(true);
  }

  function openNew() {
    setEditingEntry(null);
    setModalOpen(true);
  }

  const stats = {
    total: entries.length,
    watched: entries.filter((e) => e.status === "Assistido").length,
    watching: entries.filter((e) => e.status === "Assistindo").length,
    watchlist: entries.filter((e) => e.status === "Quero assistir").length,
    avgRating: entries.filter((e) => e.rating).length
      ? (entries.filter((e) => e.rating).reduce((s, e) => s + e.rating, 0) / entries.filter((e) => e.rating).length).toFixed(1)
      : "—",
  };

  return (
    <div className={styles.dashboard}>
      <Navbar />

      <main className={styles.main}>
        {/* Stats bar */}
        <section className={styles.statsBar} aria-label="Resumo">
          <div className={styles.stat}>
            <span className={styles.statNumber}>{stats.total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{stats.watched}</span>
            <span className={styles.statLabel}>✅ Assistidos</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{stats.watching}</span>
            <span className={styles.statLabel}>▶️ Assistindo</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{stats.watchlist}</span>
            <span className={styles.statLabel}>🔖 Na lista</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{stats.avgRating}</span>
            <span className={styles.statLabel}>⭐ Média</span>
          </div>
        </section>

        {/* Filters & Search */}
        <section className={styles.controls} aria-label="Filtros">
          {/* Filtro MoodFilm antes da busca por título */}
          <select
            id="filter-mood"
            className={`${styles.select} ${styles.selectMoodFilm}`}
            value={filters.mood}
            onChange={(e) => setFilters((f) => ({ ...f, mood: e.target.value }))}
            title="Filtrar por sentimento (MoodFilm)"
          >
            <option value="all">🎭 MoodFilm (Todos)</option>
            {MOOD_OPTIONS.map((m) => (
              <option key={m.label} value={m.label}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>

          <input
            id="search-input"
            type="search"
            placeholder="🔍 Buscar por título..."
            className={styles.searchInput}
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />

          <div className={styles.filterGroup}>
            <select
              id="filter-type"
              className={styles.select}
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="all">🎬 Todos</option>
              <option value="Filme">🎥 Filmes</option>
              <option value="Série">📺 Séries</option>
            </select>

            <select
              id="filter-status"
              className={styles.select}
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="all">Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              id="filter-genre"
              className={styles.select}
              value={filters.genre}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((f) => ({
                  ...f,
                  genre: val,
                  animationType: val === "Animação" ? f.animationType : "all",
                }));
              }}
            >
              <option value="all">Gênero</option>
              {allGenres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {filters.genre === "Animação" && (
              <select
                id="filter-animation"
                className={`${styles.select} ${styles.selectAnimation}`}
                value={filters.animationType}
                onChange={(e) => setFilters((f) => ({ ...f, animationType: e.target.value }))}
                title="Filtrar por estilo/nicho de animação"
              >
                <option value="all">🎨 Todos os nichos</option>
                <option value="2D">2D — Tradicional / Anime / 2D Autoral</option>
                <option value="2.5D">2.5D — Híbrido / NPR</option>
                <option value="3D">3D — CGI Ocidental / 3D Estilizado</option>
              </select>
            )}

            <select
              id="sort-select"
              className={styles.select}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Mais recentes</option>
              <option value="rating">Melhor Feeling (0–10)</option>
              <option value="techScore">Melhor Nota Técnica (0–5)</option>
              <option value="title">A–Z</option>
            </select>

            <button id="btn-add-entry" className={styles.addBtn} onClick={openNew}>
              + Adicionar
            </button>
          </div>
        </section>

        {/* Content */}
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner} />
            <p>Carregando sua lista...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🎭</span>
            <p className={styles.emptyTitle}>
              {entries.length === 0 ? "Sua lista está vazia" : "Nenhum resultado encontrado"}
            </p>
            <p className={styles.emptyHint}>
              {entries.length === 0
                ? "Comece adicionando um filme ou série!"
                : "Tente ajustar os filtros."}
            </p>
            {entries.length === 0 && (
              <button className={styles.addBtnEmpty} onClick={openNew}>
                + Adicionar primeiro item
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={() => openEdit(entry)}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <EntryModal
          entry={editingEntry}
          genres={allGenres}
          statusOptions={STATUS_OPTIONS}
          moodOptions={MOOD_OPTIONS}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingEntry(null); }}
        />
      )}
    </div>
  );
}
