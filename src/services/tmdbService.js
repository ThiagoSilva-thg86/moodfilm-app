// ============================================================
// TMDB Service — busca de filmes, séries, temporadas e episódios
// API gratuita: themoviedb.org/settings/api
// ============================================================

const BASE_URL = "https://api.themoviedb.org/3";
const READ_TOKEN = import.meta.env.VITE_TMDB_READ_TOKEN;
const IMG_BASE = "https://image.tmdb.org/t/p/w200";

function authHeaders() {
  if (!READ_TOKEN) {
    console.warn("[TMDB] VITE_TMDB_READ_TOKEN não encontrado. Reinicie o servidor após adicionar ao .env");
  }
  return {
    headers: {
      Authorization: `Bearer ${READ_TOKEN}`,
      "Content-Type": "application/json",
    },
  };
}

/**
 * Busca séries pelo nome (autocomplete)
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchSeries(query) {
  if (!query || query.length < 2) return [];
  const url = `${BASE_URL}/search/tv?query=${encodeURIComponent(query)}&language=pt-BR&page=1`;
  const res = await fetch(url, authHeaders());
  if (!res.ok) throw new Error(`Erro ao buscar séries (${res.status})`);
  const data = await res.json();
  return (data.results || []).slice(0, 6).map((s) => ({
    id: s.id,
    name: s.name,
    year: s.first_air_date ? s.first_air_date.slice(0, 4) : "",
    poster: s.poster_path ? `${IMG_BASE}${s.poster_path}` : null,
    overview: s.overview || "",
    voteAverage: s.vote_average || 0,
  }));
}

/**
 * Busca detalhes completos de uma série: status, temporadas, episódios
 * @param {number} seriesId
 * @returns {Promise<Object>}
 */
export async function getSeriesDetails(seriesId) {
  const url = `${BASE_URL}/tv/${seriesId}?language=pt-BR`;
  const res = await fetch(url, authHeaders());
  if (!res.ok) throw new Error(`Erro ao buscar detalhes (${res.status})`);
  const data = await res.json();

  // Buscar detalhes de cada temporada (excluindo Temporada 0 = especiais)
  const seasons = (data.seasons || []).filter((s) => s.season_number > 0);
  const seasonDetails = await Promise.all(
    seasons.map((s) => getSeasonDetails(seriesId, s.season_number))
  );

  return {
    id: data.id,
    name: data.name,
    year: data.first_air_date ? data.first_air_date.slice(0, 4) : "",
    poster: data.poster_path ? `https://image.tmdb.org/t/p/w300${data.poster_path}` : null,
    overview: data.overview || "",
    status: mapStatus(data.status),
    totalSeasons: seasons.length,
    totalEpisodes: data.number_of_episodes || 0,
    genres: (data.genres || []).slice(0, 3).map((g) => g.name),
    seasons: seasonDetails,
  };
}

/**
 * Busca episódios de uma temporada específica
 */
async function getSeasonDetails(seriesId, seasonNumber) {
  try {
    const url = `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?language=pt-BR`;
    const res = await fetch(url, authHeaders());
    if (!res.ok) return { number: seasonNumber, episodes: [] };
    const data = await res.json();
    return {
      number: seasonNumber,
      name: data.name || `Temporada ${seasonNumber}`,
      episodeCount: (data.episodes || []).length,
      episodes: (data.episodes || []).map((e) => ({
        number: e.episode_number,
        name: e.name || `Episódio ${e.episode_number}`,
        overview: e.overview || "",
        airDate: e.air_date || "",
      })),
    };
  } catch {
    return { number: seasonNumber, episodes: [] };
  }
}

/**
 * Mapeia o status do TMDB para português
 */
function mapStatus(status) {
  const map = {
    // Séries
    "Returning Series": "Em andamento",
    "Ended": "Encerrada",
    "Canceled": "Cancelada",
    "In Production": "Em produção",
    "Planned": "Planejada",
    // Filmes
    "Released": "Lançado",
    "Post Production": "Pós-produção",
    "Rumored": "Rumor",
  };
  return map[status] || status || "Desconhecido";
}

/**
 * Busca filmes pelo nome (autocomplete)
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchMovies(query) {
  if (!query || query.length < 2) return [];
  const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=pt-BR&page=1`;
  const res = await fetch(url, authHeaders());
  if (!res.ok) throw new Error(`Erro ao buscar filmes (${res.status})`);
  const data = await res.json();
  return (data.results || []).slice(0, 6).map((m) => ({
    id: m.id,
    name: m.title,
    year: m.release_date ? m.release_date.slice(0, 4) : "",
    poster: m.poster_path ? `${IMG_BASE}${m.poster_path}` : null,
    overview: m.overview || "",
    voteAverage: m.vote_average || 0,
  }));
}

/**
 * Busca detalhes completos de um filme
 * @param {number} movieId
 * @returns {Promise<Object>}
 */
export async function getMovieDetails(movieId) {
  const url = `${BASE_URL}/movie/${movieId}?language=pt-BR`;
  const res = await fetch(url, authHeaders());
  if (!res.ok) throw new Error(`Erro ao buscar detalhes do filme (${res.status})`);
  const data = await res.json();

  return {
    id: data.id,
    name: data.title,
    year: data.release_date ? data.release_date.slice(0, 4) : "",
    poster: data.poster_path ? `https://image.tmdb.org/t/p/w300${data.poster_path}` : null,
    backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w780${data.backdrop_path}` : null,
    overview: data.overview || "",
    status: mapStatus(data.status),
    runtime: data.runtime || 0,          // duração em minutos
    genres: (data.genres || []).slice(0, 3).map((g) => g.name),
    tagline: data.tagline || "",
  };
}

export { IMG_BASE };
