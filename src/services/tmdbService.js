// ============================================================
// TMDB Service — busca de séries e detalhes (temporadas/episódios)
// API gratuita: themoviedb.org/settings/api
// ============================================================

const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMG_BASE = "https://image.tmdb.org/t/p/w200";

/**
 * Busca séries pelo nome (autocomplete)
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchSeries(query) {
  if (!query || query.length < 2) return [];
  const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar séries");
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
  const url = `${BASE_URL}/tv/${seriesId}?api_key=${API_KEY}&language=pt-BR&append_to_response=season/1,season/2,season/3,season/4,season/5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar detalhes da série");
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
    const url = `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${API_KEY}&language=pt-BR`;
    const res = await fetch(url);
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
    "Returning Series": "Em andamento",
    "Ended": "Encerrada",
    "Canceled": "Cancelada",
    "In Production": "Em produção",
    "Planned": "Planejada",
  };
  return map[status] || status || "Desconhecido";
}

export { IMG_BASE };
