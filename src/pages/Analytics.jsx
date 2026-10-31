import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getUserEntries } from "../services/entriesService";
import Navbar from "../components/Navbar";
import { formatScore } from "../constants/technicalCriteria";
import styles from "./Analytics.module.css";

export default function Analytics() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getUserEntries(currentUser.uid);
        setEntries(data);
      } catch (err) {
        console.error("Erro ao carregar dados analíticos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser.uid]);

  // Cálculos de todas as 14 visualizações analíticas
  const stats = useMemo(() => {
    const total = entries.length;
    if (total === 0) return null;

    // 1. Tipos: Filmes vs Séries
    const movies = entries.filter((e) => e.type === "Filme");
    const series = entries.filter((e) => e.type === "Série");

    // 2. Tempo total assistido
    let movieMinutes = 0;
    let seriesMinutes = 0;
    let totalEpisodes = 0;
    let totalSeasons = 0;

    entries.forEach((e) => {
      const sd = e.seriesData;
      if (e.type === "Filme") {
        const runtime = sd?.runtime || 105; // 105 min média se não especificado
        if (e.status === "Assistido") movieMinutes += runtime;
        else if (e.status === "Assistindo") movieMinutes += Math.round(runtime * 0.5);
      } else {
        const eps = sd?.totalEpisodes || (sd?.totalSeasons ? sd.totalSeasons * 10 : 8);
        const seasons = sd?.totalSeasons || 1;
        totalEpisodes += eps;
        totalSeasons += seasons;
        const epTime = 48; // média de 48 min por episódio de série
        if (e.status === "Assistido") seriesMinutes += eps * epTime;
        else if (e.status === "Assistindo") seriesMinutes += Math.round(eps * epTime * 0.4);
      }
    });

    const totalMinutes = movieMinutes + seriesMinutes;
    const totalHours = Math.round(totalMinutes / 60);
    const totalDays = (totalHours / 24).toFixed(1);

    // 3. Status
    const watched = entries.filter((e) => e.status === "Assistido").length;
    const watching = entries.filter((e) => e.status === "Assistindo").length;
    const wantToWatch = entries.filter((e) => e.status === "Quero assistir").length;
    const completionRate = (watched + watching) > 0 ? Math.round((watched / (watched + watching)) * 100) : 0;

    // 4. Gêneros
    const genreMap = {};
    entries.forEach((e) => {
      const glist = Array.isArray(e.genres) ? e.genres : e.genre ? [e.genre] : [];
      glist.forEach((g) => {
        if (!g) return;
        genreMap[g] = (genreMap[g] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 5. Humores
    const moodMap = {};
    entries.forEach((e) => {
      const mlist = Array.isArray(e.moods) ? e.moods : e.mood ? [e.mood] : [];
      mlist.forEach((m) => {
        if (!m) return;
        moodMap[m] = (moodMap[m] || 0) + 1;
      });
    });
    const topMoods = Object.entries(moodMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 6. Distribuição de Notas (1 a 10) - agrupa por aproximação inteira para manter histograma limpo
    const ratedEntries = entries.filter((e) => Number(e.rating) > 0);
    const ratingDist = Array.from({ length: 10 }, (_, i) => ({
      score: i + 1,
      count: ratedEntries.filter((e) => Math.round(Number(e.rating)) === i + 1).length,
    }));
    const avgUserRating = ratedEntries.length > 0
      ? (ratedEntries.reduce((acc, e) => acc + Number(e.rating), 0) / ratedEntries.length).toFixed(1)
      : null;

    // Estatísticas da Nota Técnica (0 a 5)
    const techEntries = entries.filter((e) => Number(e.technicalScore) > 0);
    const avgTechRating = techEntries.length > 0
      ? (techEntries.reduce((acc, e) => acc + Number(e.technicalScore), 0) / techEntries.length).toFixed(1)
      : null;

    // 7. Barômetro de Satisfação: Amados (8-10), Neutros (5-7), Baixos (1-4)
    const loved = ratedEntries.filter((e) => e.rating >= 8).length;
    const neutral = ratedEntries.filter((e) => e.rating >= 5 && e.rating <= 7).length;
    const low = ratedEntries.filter((e) => e.rating < 5).length;

    // 8. Comparativo Você vs TMDB
    let tmdbSum = 0;
    let userSumForTmdb = 0;
    let bothRatedCount = 0;
    entries.forEach((e) => {
      const tScore = e.seriesData?.voteAverage || e.seriesData?.vote_average;
      const uScore = Number(e.rating);
      if (tScore > 0 && uScore > 0) {
        tmdbSum += Number(tScore);
        userSumForTmdb += uScore;
        bothRatedCount++;
      }
    });
    const avgTmdb = bothRatedCount > 0 ? (tmdbSum / bothRatedCount).toFixed(1) : null;
    const avgUserPaired = bothRatedCount > 0 ? (userSumForTmdb / bothRatedCount).toFixed(1) : null;
    const diff = avgTmdb && avgUserPaired ? (Number(avgUserPaired) - Number(avgTmdb)).toFixed(1) : null;

    // 9. Nicho de Animação
    const animEntries = entries.filter((e) => {
      const glist = Array.isArray(e.genres) ? e.genres : e.genre ? [e.genre] : [];
      return glist.includes("Animação");
    });
    const anim2D = animEntries.filter((e) => e.animationType === "2D" || e.animationType?.startsWith("2D")).length;
    const anim25D = animEntries.filter((e) => e.animationType === "2.5D" || e.animationType?.startsWith("2.5D")).length;
    const anim3D = animEntries.filter((e) => e.animationType === "3D" || e.animationType?.startsWith("3D")).length;
    const animUndefined = animEntries.length - (anim2D + anim25D + anim3D);

    // 10. Status de Produção de Séries (Encerrada vs Em andamento)
    const seriesEnded = series.filter((e) => e.seriesData?.status === "Encerrada").length;
    const seriesActive = series.filter((e) => e.seriesData?.status === "Em andamento" || e.seriesData?.status === "Em produção").length;

    // 11. Épocas de Lançamento (Décadas)
    const decadeMap = { "Anos 80 ou antes": 0, "Anos 90": 0, "Anos 2000": 0, "Anos 2010": 0, "Anos 2020+": 0 };
    entries.forEach((e) => {
      const yearStr = e.seriesData?.year || "";
      const y = parseInt(yearStr, 10);
      if (y) {
        if (y < 1990) decadeMap["Anos 80 ou antes"]++;
        else if (y < 2000) decadeMap["Anos 90"]++;
        else if (y < 2010) decadeMap["Anos 2000"]++;
        else if (y < 2020) decadeMap["Anos 2010"]++;
        else decadeMap["Anos 2020+"]++;
      }
    });

    // 12. Hall da Fama / Top Avaliados
    const topRated = [...ratedEntries]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    // 13. Resenhas & Engajamento
    const withReview = entries.filter((e) => e.review && e.review.trim().length > 0);
    const totalWords = withReview.reduce((acc, e) => acc + e.review.trim().split(/\s+/).length, 0);

    // 14. Taxa de Maratonista (Média de Episódios por Série)
    const avgEpisodesPerSeries = series.length > 0 ? Math.round(totalEpisodes / series.length) : 0;

    return {
      total,
      moviesCount: movies.length,
      seriesCount: series.length,
      totalHours,
      totalDays,
      movieHours: Math.round(movieMinutes / 60),
      seriesHours: Math.round(seriesMinutes / 60),
      watched,
      watching,
      wantToWatch,
      completionRate,
      topGenres: topGenres.slice(0, 7),
      topMoods: topMoods.slice(0, 8),
      ratingDist,
      avgUserRating,
      avgTechRating,
      ratedCount: ratedEntries.length,
      loved,
      neutral,
      low,
      avgTmdb,
      avgUserPaired,
      diff,
      bothRatedCount,
      animTotal: animEntries.length,
      anim2D,
      anim25D,
      anim3D,
      animUndefined,
      totalEpisodes,
      totalSeasons,
      avgEpisodesPerSeries,
      seriesEnded,
      seriesActive,
      decadeMap,
      topRated,
      withReviewCount: withReview.length,
      reviewRate: Math.round((withReview.length / total) * 100),
      totalWords,
    };
  }, [entries]);

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.container}>
        {/* Header com navegação de volta */}
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>
              <Link to="/" className={styles.backLink}>← Voltar ao Diário</Link>
            </div>
            <h1 className={styles.title}>📊 Dashboard Analítico</h1>
            <p className={styles.subtitle}>
              Raio-X completo dos seus hábitos cinematográficos, humores e preferências
            </p>
          </div>
          <button className={styles.refreshBtn} onClick={() => navigate("/")}>
            🎬 Ver Minha Lista
          </button>
        </header>

        {loading ? (
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <p>Calculando suas estatísticas analíticas...</p>
          </div>
        ) : !stats || stats.total === 0 ? (
          <div className={styles.emptyBox}>
            <span className={styles.emptyIcon}>📈</span>
            <h2>Nenhum dado para analisar ainda</h2>
            <p>Adicione filmes e séries ao seu diário para desbloquear os gráficos e insights!</p>
            <Link to="/" className={styles.primaryBtn}>Ir para o Diário</Link>
          </div>
        ) : (
          <div className={styles.dashboardGrid}>

            {/* ========================================================
                VIEW 1: TEMPO TOTAL INVESTIDO (Hero Card)
            ======================================================== */}
            <section className={`${styles.card} ${styles.cardHero}`} aria-label="Tempo total investido">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>⏱️ Visão 1</span>
                <h3>Tempo Total Assistido</h3>
              </div>
              <div className={styles.heroMetricRow}>
                <div className={styles.heroMainMetric}>
                  <span className={styles.heroBigNum}>{stats.totalHours}</span>
                  <span className={styles.heroUnit}>horas</span>
                  <span className={styles.heroSubText}>≈ {stats.totalDays} dias de tela</span>
                </div>
                <div className={styles.heroSplits}>
                  <div className={styles.heroSplitItem}>
                    <span className={styles.splitIcon}>🎥</span>
                    <div>
                      <strong>{stats.movieHours}h</strong> em filmes
                    </div>
                  </div>
                  <div className={styles.heroSplitItem}>
                    <span className={styles.splitIcon}>📺</span>
                    <div>
                      <strong>{stats.seriesHours}h</strong> em séries
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================
                VIEW 2: PROPORÇÃO FILMES VS SÉRIES (Donut / Barra)
            ======================================================== */}
            <section className={styles.card} aria-label="Proporção Filmes vs Séries">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>⚖️ Visão 2</span>
                <h3>Filmes vs Séries</h3>
              </div>
              <div className={styles.ratioVisual}>
                <div className={styles.ratioBar}>
                  <div
                    className={styles.ratioMovies}
                    style={{ width: `${(stats.moviesCount / stats.total) * 100}%` }}
                    title={`Filmes: ${stats.moviesCount}`}
                  />
                  <div
                    className={styles.ratioSeries}
                    style={{ width: `${(stats.seriesCount / stats.total) * 100}%` }}
                    title={`Séries: ${stats.seriesCount}`}
                  />
                </div>
                <div className={styles.ratioLegend}>
                  <div className={styles.legendItem}>
                    <span className={styles.dotMovie} />
                    <span>🎥 Filmes: <strong>{stats.moviesCount}</strong> ({Math.round((stats.moviesCount / stats.total) * 100)}%)</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.dotSeries} />
                    <span>📺 Séries: <strong>{stats.seriesCount}</strong> ({Math.round((stats.seriesCount / stats.total) * 100)}%)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================
                VIEW 3: FUNIL DE STATUS & TAXA DE CONCLUSÃO
            ======================================================== */}
            <section className={styles.card} aria-label="Status de consumo">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>📌 Visão 3</span>
                <h3>Status do Catálogo</h3>
              </div>
              <div className={styles.statusList}>
                <div className={styles.statusRow}>
                  <span className={styles.statusLabel}>✅ Assistidos</span>
                  <div className={styles.statusBarBg}>
                    <div className={styles.statusBarWatched} style={{ width: `${(stats.watched / stats.total) * 100}%` }} />
                  </div>
                  <span className={styles.statusVal}>{stats.watched}</span>
                </div>
                <div className={styles.statusRow}>
                  <span className={styles.statusLabel}>👀 Assistindo</span>
                  <div className={styles.statusBarBg}>
                    <div className={styles.statusBarWatching} style={{ width: `${(stats.watching / stats.total) * 100}%` }} />
                  </div>
                  <span className={styles.statusVal}>{stats.watching}</span>
                </div>
                <div className={styles.statusRow}>
                  <span className={styles.statusLabel}>⏳ Quero Assistir</span>
                  <div className={styles.statusBarBg}>
                    <div className={styles.statusBarWant} style={{ width: `${(stats.wantToWatch / stats.total) * 100}%` }} />
                  </div>
                  <span className={styles.statusVal}>{stats.wantToWatch}</span>
                </div>
              </div>
              <div className={styles.completionPill}>
                Taxa de Conclusão: <strong>{stats.completionRate}%</strong> finalizados
              </div>
            </section>

            {/* ========================================================
                VIEW 4: TOP GÊNEROS FAVORITOS
            ======================================================== */}
            <section className={`${styles.card} ${styles.cardSpan2}`} aria-label="Gêneros favoritos">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>🏆 Visão 4</span>
                <h3>Top Gêneros Favoritos</h3>
              </div>
              <div className={styles.barsList}>
                {stats.topGenres.map((item, idx) => {
                  const max = stats.topGenres[0]?.count || 1;
                  const pct = Math.round((item.count / max) * 100);
                  return (
                    <div key={item.name} className={styles.hBarRow}>
                      <span className={styles.hBarRank}>#{idx + 1}</span>
                      <span className={styles.hBarName}>{item.name}</span>
                      <div className={styles.hBarTrack}>
                        <div className={styles.hBarFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.hBarCount}>{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ========================================================
                VIEW 5: MAPA EMOCIONAL (MOODBOARD)
            ======================================================== */}
            <section className={`${styles.card} ${styles.cardSpan2}`} aria-label="Humores mais sentidos">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>🎭 Visão 5</span>
                <h3>Mapa Emocional (Humores Registrados)</h3>
              </div>
              <div className={styles.moodGrid}>
                {stats.topMoods.map((item) => {
                  const emoji = item.name.split(" ")[0];
                  const label = item.name.split(" ").slice(1).join(" ");
                  return (
                    <div key={item.name} className={styles.moodTile}>
                      <span className={styles.moodTileEmoji}>{emoji}</span>
                      <span className={styles.moodTileLabel}>{label}</span>
                      <span className={styles.moodTileCount}>{item.count}x</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ========================================================
                VIEW 6: HISTOGRAMA DE NOTAS (1 A 10)
            ======================================================== */}
            <section className={`${styles.card} ${styles.cardSpan2}`} aria-label="Distribuição de notas">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>⭐ Visão 6</span>
                <h3>Distribuição das Suas Notas (Feeling 1 a 10)</h3>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {stats.avgUserRating && (
                    <span className={styles.avgBadge}>Média Feeling: 💜 {formatScore(stats.avgUserRating)} / 10</span>
                  )}
                  {stats.avgTechRating && (
                    <span className={styles.avgBadge} style={{ borderColor: "rgba(139, 92, 246, 0.5)", color: "#c4b5fd" }}>
                      Média Técnica: 🎬 {formatScore(stats.avgTechRating)} / 5 ★
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.chartHistogram}>
                {stats.ratingDist.map((col) => {
                  const maxCount = Math.max(...stats.ratingDist.map((c) => c.count), 1);
                  const barHeightPct = col.count > 0 ? Math.max((col.count / maxCount) * 100, 12) : 4;
                  return (
                    <div key={col.score} className={styles.histogramCol}>
                      <span className={styles.histCount}>{col.count > 0 ? col.count : ""}</span>
                      <div className={styles.histBarTrack}>
                        <div
                          className={`${styles.histBar} ${col.score >= 8 ? styles.barHigh : col.score >= 5 ? styles.barMed : styles.barLow}`}
                          style={{ height: `${barHeightPct}%` }}
                        />
                      </div>
                      <span className={styles.histScore}>{col.score}★</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ========================================================
                VIEW 7: BARÔMETRO DE SATISFAÇÃO
            ======================================================== */}
            <section className={styles.card} aria-label="Barômetro de satisfação">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>🎯 Visão 7</span>
                <h3>Barômetro de Satisfação</h3>
              </div>
              <div className={styles.satisfactionRow}>
                <div className={styles.satItem}>
                  <span className={styles.satIcon}>😍</span>
                  <span className={styles.satNum}>{stats.loved}</span>
                  <span className={styles.satLabel}>Amados (8–10)</span>
                </div>
                <div className={styles.satItem}>
                  <span className={styles.satIcon}>😐</span>
                  <span className={styles.satNum}>{stats.neutral}</span>
                  <span className={styles.satLabel}>Neutros (5–7)</span>
                </div>
                <div className={styles.satItem}>
                  <span className={styles.satIcon}>💔</span>
                  <span className={styles.satNum}>{stats.low}</span>
                  <span className={styles.satLabel}>Decepções (1–4)</span>
                </div>
              </div>
            </section>

            {/* ========================================================
                VIEW 8: VOCÊ VS TMDB (CRÍTICA VS PÚBLICO)
            ======================================================== */}
            <section className={styles.card} aria-label="Comparativo Você vs TMDB">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>⚖️ Visão 8</span>
                <h3>Você vs TMDB</h3>
              </div>
              {stats.bothRatedCount > 0 ? (
                <div className={styles.compareWrapper}>
                  <div className={styles.comparePair}>
                    <div className={styles.compareBox}>
                      <span className={styles.compareLabel}>Sua Média</span>
                      <span className={styles.compareValUser}>⭐ {stats.avgUserPaired}</span>
                    </div>
                    <span className={styles.compareVs}>VS</span>
                    <div className={styles.compareBox}>
                      <span className={styles.compareLabel}>Média TMDB</span>
                      <span className={styles.compareValTmdb}>🎬 {stats.avgTmdb}</span>
                    </div>
                  </div>
                  <div className={styles.compareInsight}>
                    {Number(stats.diff) > 0 ? (
                      <span className={styles.diffGenerous}>
                        🎉 Você é <strong>+{stats.diff} pts</strong> mais generoso que a crítica!
                      </span>
                    ) : Number(stats.diff) < 0 ? (
                      <span className={styles.diffCritical}>
                        🧐 Você é <strong>{stats.diff} pts</strong> mais criterioso que o público!
                      </span>
                    ) : (
                      <span className={styles.diffEqual}>
                        🤝 Suas notas estão em perfeita sintonia com o TMDB!
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className={styles.cardEmptyDesc}>Avalie filmes buscados no TMDB para comparar suas notas.</p>
              )}
            </section>

            {/* ========================================================
                VIEW 9: NICHOS DE ANIMAÇÃO (2D / 2.5D / 3D)
            ======================================================== */}
            <section className={styles.card} aria-label="Nichos de Animação">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>🎨 Visão 9</span>
                <h3>Nichos de Animação</h3>
              </div>
              {stats.animTotal > 0 ? (
                <div className={styles.animStats}>
                  <div className={styles.animPills}>
                    <div className={styles.animPill}>
                      <span className={styles.animPillTag}>2D</span>
                      <strong>{stats.anim2D}</strong>
                      <small>Tradicional/Anime</small>
                    </div>
                    <div className={styles.animPill}>
                      <span className={styles.animPillTag}>2.5D</span>
                      <strong>{stats.anim25D}</strong>
                      <small>Híbrido/NPR</small>
                    </div>
                    <div className={styles.animPill}>
                      <span className={styles.animPillTag}>3D</span>
                      <strong>{stats.anim3D}</strong>
                      <small>CGI/Estilizado</small>
                    </div>
                  </div>
                  <div className={styles.animTotalFoot}>
                    Total de <strong>{stats.animTotal}</strong> animação(ões) catalogadas
                  </div>
                </div>
              ) : (
                <p className={styles.cardEmptyDesc}>Nenhuma animação adicionada ainda.</p>
              )}
            </section>

            {/* ========================================================
                VIEW 10: MARATONAS DE SÉRIES (EPISÓDIOS & TEMPORADAS)
            ======================================================== */}
            <section className={styles.card} aria-label="Estatísticas de séries">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>📺 Visão 10</span>
                <h3>Maratonas de Séries</h3>
              </div>
              <div className={styles.seriesStatsGrid}>
                <div className={styles.miniStatBox}>
                  <span className={styles.miniStatNum}>{stats.totalEpisodes}</span>
                  <span className={styles.miniStatLabel}>Episódios Totais</span>
                </div>
                <div className={styles.miniStatBox}>
                  <span className={styles.miniStatNum}>{stats.totalSeasons}</span>
                  <span className={styles.miniStatLabel}>Temporadas</span>
                </div>
                <div className={styles.miniStatBox}>
                  <span className={styles.miniStatNum}>{stats.avgEpisodesPerSeries}</span>
                  <span className={styles.miniStatLabel}>Média Ep/Série</span>
                </div>
              </div>
            </section>

            {/* ========================================================
                VIEW 11: STATUS DE SÉRIES (ENCERRADAS VS ATIVAS)
            ======================================================== */}
            <section className={styles.card} aria-label="Status das séries">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>🏁 Visão 11</span>
                <h3>Situação das Séries</h3>
              </div>
              <div className={styles.seriesStatusCompare}>
                <div className={styles.seriesStatusCol}>
                  <span className={styles.statusEndedDot}>⚫</span>
                  <strong>{stats.seriesEnded}</strong>
                  <span>Encerradas</span>
                </div>
                <div className={styles.seriesStatusCol}>
                  <span className={styles.statusActiveDot}>🟢</span>
                  <strong>{stats.seriesActive}</strong>
                  <span>Em andamento</span>
                </div>
              </div>
            </section>

            {/* ========================================================
                VIEW 12: ÉPOCAS & DÉCADAS DE LANÇAMENTO
            ======================================================== */}
            <section className={styles.card} aria-label="Épocas de lançamento">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>📅 Visão 12</span>
                <h3>Épocas de Lançamento</h3>
              </div>
              <div className={styles.decadesList}>
                {Object.entries(stats.decadeMap).map(([decade, count]) => (
                  <div key={decade} className={styles.decadeItem}>
                    <span className={styles.decadeLabel}>{decade}</span>
                    <span className={styles.decadeCount}>{count} item(s)</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ========================================================
                VIEW 13: HALL DA FAMA (TOP 5 MAIS BEM AVALIADOS)
            ======================================================== */}
            <section className={`${styles.card} ${styles.cardSpan2}`} aria-label="Obras-primas">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>🥇 Visão 13</span>
                <h3>Hall da Fama (Suas Maiores Notas)</h3>
              </div>
              {stats.topRated.length > 0 ? (
                <div className={styles.hallOfFameGrid}>
                  {stats.topRated.map((item, idx) => (
                    <div key={item.id} className={styles.hallItem}>
                      <span className={styles.hallRank}>#{idx + 1}</span>
                      {item.seriesData?.poster && (
                        <img src={item.seriesData.poster} alt={item.title} className={styles.hallPoster} />
                      )}
                      <div className={styles.hallInfo}>
                        <strong className={styles.hallTitle}>{item.title}</strong>
                        <div className={styles.hallMeta}>
                          <span className={styles.hallRating}>⭐ {item.rating}/10</span>
                          {item.moods?.[0] && <span className={styles.hallMood}>{item.moods[0]}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.cardEmptyDesc}>Nenhum título avaliado com nota ainda.</p>
              )}
            </section>

            {/* ========================================================
                VIEW 14: ENGAJAMENTO & RESENHAS ESCRITAS
            ======================================================== */}
            <section className={styles.card} aria-label="Engajamento de resenhas">
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>✍️ Visão 14</span>
                <h3>Engajamento Crítico</h3>
              </div>
              <div className={styles.reviewStats}>
                <div className={styles.reviewMetric}>
                  <span className={styles.reviewMetricNum}>{stats.reviewRate}%</span>
                  <span className={styles.reviewMetricLabel}>das obras com resenha escrita</span>
                </div>
                <div className={styles.reviewWords}>
                  <span>📝 <strong>{stats.totalWords}</strong> palavras registradas no seu diário</span>
                  <span>💬 <strong>{stats.withReviewCount}</strong> resenhas publicadas</span>
                </div>
              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  );
}
