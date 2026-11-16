import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import {
  FORUM_CATEGORIES,
  createTopic,
  subscribeToTopics,
  subscribeToComments,
  addComment,
  deleteTopic,
  deleteComment,
} from "../services/forumService";
import styles from "./Forum.module.css";

// Formatação amigável de datas relativas
function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 60) return "agora há pouco";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return "ontem";

  const date = new Date(timestamp);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Forum() {
  const { currentUser } = useAuth();

  // Estados dos Tópicos
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Estado da Discussão Aberta (Chat em Tempo Real)
  const [activeTopic, setActiveTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Estado do Modal de Criação de Tópico
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("geral");
  const [newContent, setNewContent] = useState("");
  const [submittingTopic, setSubmittingTopic] = useState(false);
  const [modalError, setModalError] = useState("");

  const messagesEndRef = useRef(null);

  // 1. Escuta a lista de tópicos em tempo real via WebSocket do Realtime Database
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTopics((list) => {
      setTopics(list);
      setLoading(false);

      // Se o tópico ativo sofrer atualização no banco, atualiza seus dados locais
      if (activeTopic) {
        const updated = list.find((t) => t.id === activeTopic.id);
        if (updated) setActiveTopic(updated);
      }
    });

    return () => unsubscribe();
  }, [activeTopic?.id]);

  // 2. Quando um tópico é aberto, escuta os comentários em tempo real
  useEffect(() => {
    if (!activeTopic) {
      setComments([]);
      return;
    }

    const unsubscribe = subscribeToComments(activeTopic.id, (commentsList) => {
      setComments(commentsList);
    });

    return () => unsubscribe();
  }, [activeTopic?.id]);

  // 3. Rola a tela até o final quando novas mensagens chegam no chat
  useEffect(() => {
    if (activeTopic && comments.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length, activeTopic]);

  // Manipulador: Criar novo tópico
  async function handleCreateTopic(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setModalError("Por favor, preencha o título e a mensagem inicial.");
      return;
    }

    try {
      setSubmittingTopic(true);
      setModalError("");

      const topicId = await createTopic({
        title: newTitle.trim(),
        category: newCategory,
        content: newContent.trim(),
        authorId: currentUser?.uid,
        authorNickname: currentUser?.displayName || "Cinéfilo",
      });

      // Limpa os campos e fecha o modal
      setNewTitle("");
      setNewContent("");
      setNewCategory("geral");
      setIsModalOpen(false);

      // Abre automaticamente a discussão criada para o autor já interagir
      const created = {
        id: topicId,
        title: newTitle.trim(),
        category: newCategory,
        authorId: currentUser?.uid,
        authorNickname: currentUser?.displayName || "Cinéfilo",
        createdAtClient: Date.now(),
        replyCount: 1,
      };
      setActiveTopic(created);
    } catch (err) {
      console.error("Erro ao criar tópico:", err);
      setModalError(err.message || "Erro ao criar discussão. Tente novamente.");
    } finally {
      setSubmittingTopic(false);
    }
  }

  // Manipulador: Enviar resposta no chat em tempo real
  async function handleSendReply(e) {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || !activeTopic || sendingReply) return;

    try {
      setSendingReply(true);
      await addComment(activeTopic.id, {
        text: trimmed,
        authorId: currentUser?.uid,
        authorNickname: currentUser?.displayName || "Cinéfilo",
        currentReplyCount: activeTopic.replyCount || comments.length,
      });

      setReplyText("");
    } catch (err) {
      console.error("Erro ao enviar resposta:", err);
      alert("Não foi possível enviar a mensagem. Verifique sua conexão.");
    } finally {
      setSendingReply(false);
    }
  }

  // Manipulador: Excluir tópico (somente autor)
  async function handleDeleteTopic(topicId) {
    if (!window.confirm("Tem certeza que deseja excluir esta discussão e todas as respostas?")) {
      return;
    }
    try {
      await deleteTopic(topicId);
      setActiveTopic(null);
    } catch (err) {
      console.error("Erro ao excluir tópico:", err);
      alert("Erro ao excluir discussão.");
    }
  }

  // Manipulador: Excluir comentário individual (somente autor)
  async function handleDeleteComment(commentId) {
    if (!window.confirm("Deseja apagar sua mensagem?")) return;
    try {
      await deleteComment(activeTopic.id, commentId, activeTopic.replyCount);
    } catch (err) {
      console.error("Erro ao apagar mensagem:", err);
    }
  }

  // Filtragem dos tópicos
  const filteredTopics = topics.filter((t) => {
    const matchCategory =
      selectedCategory === "all" || t.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.authorNickname?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className={styles.container}>
      <Navbar />

      <main className={styles.main}>
        {/* ============================================================
            TELA 1: LISTAGEM DE DISCUSSÕES DA COMUNIDADE
            ============================================================ */}
        {!activeTopic ? (
          <>
            {/* Banner Superior com Botão de Ação */}
            <header className={styles.headerBanner}>
              <div className={styles.headerText}>
                <h1 className={styles.headerTitle}>
                  <span>💬</span> Comunidade MoodFilm
                </h1>
                <p className={styles.headerDesc}>
                  Fórum e bate-papo em tempo real. Debata teorias, indique obras e
                  troque ideias com outros cinéfilos.
                </p>
              </div>

              <button
                className={styles.newTopicBtn}
                onClick={() => setIsModalOpen(true)}
                id="btn-new-topic"
              >
                <span>✍️</span> + Nova Discussão
              </button>
            </header>

            {/* Barra de Filtros: Busca e Chips de Categorias */}
            <section className={styles.filterBar}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon} aria-hidden="true">
                  🔍
                </span>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Pesquisar por título ou cinéfilo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.categoryChips} role="tablist">
                {FORUM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className={`${styles.chip} ${
                      selectedCategory === cat.id ? styles.chipActive : ""
                    }`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Listagem de Cards de Tópicos */}
            {loading ? (
              <div className={styles.emptyState}>
                <div className={styles.spinner} />
                <p>Carregando discussões em tempo real...</p>
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🎬</div>
                <h3 className={styles.emptyTitle}>
                  {topics.length === 0
                    ? "Nenhuma discussão iniciada ainda"
                    : "Nenhum resultado para os filtros"}
                </h3>
                <p className={styles.emptySubtitle}>
                  {topics.length === 0
                    ? "Seja o primeiro a abrir um tópico e conversar com a comunidade!"
                    : "Tente mudar a categoria ou termo de busca."}
                </p>
                {topics.length === 0 && (
                  <button
                    className={styles.newTopicBtn}
                    onClick={() => setIsModalOpen(true)}
                  >
                    <span>✍️</span> Iniciar Primeira Discussão
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.topicsList}>
                {filteredTopics.map((topic) => {
                  const catObj =
                    FORUM_CATEGORIES.find((c) => c.id === topic.category) || {};
                  const initial = (topic.authorNickname || "C")[0].toUpperCase();

                  return (
                    <article
                      key={topic.id}
                      className={styles.topicCard}
                      onClick={() => setActiveTopic(topic)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Abrir discussão: ${topic.title}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setActiveTopic(topic);
                        }
                      }}
                    >
                      <div className={styles.topicMainInfo}>
                        <div className={styles.topicMeta}>
                          <span className={styles.categoryBadge}>
                            {catObj.icon || "🎬"} {catObj.label?.replace(/^[^\s]+\s/, "") || topic.category}
                          </span>
                          <span className={styles.topicAuthor}>
                            <span className={styles.authorInitial}>
                              {initial}
                            </span>
                            <strong>{topic.authorNickname}</strong>
                          </span>
                          <span className={styles.topicDate}>
                            • {formatRelativeTime(topic.createdAtClient || topic.lastActivityAt)}
                          </span>
                        </div>

                        <h2 className={styles.topicTitle}>{topic.title}</h2>
                      </div>

                      <div className={styles.topicStats}>
                        <span className={styles.replyBadge} title="Mensagens neste debate">
                          💬 {topic.replyCount || 1} {topic.replyCount === 1 ? "mensagem" : "mensagens"}
                        </span>
                        <span className={styles.arrowIcon} aria-hidden="true">
                          →
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ============================================================
             TELA 2: DISCUSSÃO ABERTA (CHAT EM TEMPO REAL)
             ============================================================ */
          <div className={styles.discussionView}>
            <button
              className={styles.backBtn}
              onClick={() => setActiveTopic(null)}
              id="btn-back-to-forum"
            >
              ← Voltar às Discussões
            </button>

            {/* Cabeçalho da Discussão Aberta */}
            <header className={styles.discussionHeader}>
              <div className={styles.discussionTitleRow}>
                <h1 className={styles.discussionTitle}>{activeTopic.title}</h1>
                {currentUser?.uid === activeTopic.authorId && (
                  <button
                    className={styles.deleteTopicBtn}
                    onClick={() => handleDeleteTopic(activeTopic.id)}
                    title="Excluir este tópico"
                  >
                    🗑️ Excluir Tópico
                  </button>
                )}
              </div>

              <div className={styles.discussionMeta}>
                <span>
                  Iniciado por <strong>{activeTopic.authorNickname}</strong>
                </span>
                <span>•</span>
                <span>{formatRelativeTime(activeTopic.createdAtClient)}</span>
                <span>•</span>
                <span className={styles.realtimeIndicator}>
                  <span className={styles.pulseDot} />
                  Ao vivo via Realtime Database
                </span>
              </div>
            </header>

            {/* Feed de Comentários em Tempo Real */}
            <div className={styles.commentsFeed}>
              {comments.map((comment, idx) => {
                const isOp = comment.isOriginalPost || idx === 0;
                const isMyComment = currentUser?.uid === comment.authorId;
                const initial = (comment.authorNickname || "U")[0].toUpperCase();

                return (
                  <div
                    key={comment.id}
                    className={`${styles.commentBubble} ${
                      isOp ? styles.commentOriginalPost : ""
                    }`}
                  >
                    <div className={styles.commentHeader}>
                      <div className={styles.commentAuthorInfo}>
                        <div className={styles.commentAvatar}>{initial}</div>
                        <div>
                          <strong className={styles.commentAuthorName}>
                            {comment.authorNickname}
                          </strong>{" "}
                          {isOp && (
                            <span className={styles.opBadge}>
                              ⭐ Criador do Tópico
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className={styles.commentTime}>
                          {formatRelativeTime(comment.createdAtClient)}
                        </span>
                        {isMyComment && !isOp && (
                          <button
                            className={styles.commentDeleteBtn}
                            onClick={() => handleDeleteComment(comment.id)}
                            title="Apagar minha mensagem"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    <p className={styles.commentText}>{comment.text}</p>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Barra de Envio de Resposta em Tempo Real */}
            <form onSubmit={handleSendReply} className={styles.replyBar}>
              <textarea
                className={styles.replyInput}
                placeholder="Escreva sua resposta ou teoria sobre a obra..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply(e);
                  }
                }}
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={!replyText.trim() || sendingReply}
                id="btn-send-reply"
              >
                <span>🚀</span> Enviar
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ============================================================
          MODAL: CRIAR NOVA DISCUSSÃO
          ============================================================ */}
      {isModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>✍️ Iniciar Nova Discussão</h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {modalError && <div className={styles.errorMessage}>{modalError}</div>}

            <form onSubmit={handleCreateTopic}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Título da Discussão</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Ex: O que acharam da reviravolta de Parasita?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Categoria Temática</label>
                <select
                  className={styles.formSelect}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {FORUM_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label?.replace(/^[^\s]+\s/, "")}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mensagem Inicial</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Compartilhe seu ponto de vista, dúvida ou teoria para abrir o debate..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.modalSubmitBtn}
                  disabled={submittingTopic}
                  id="btn-submit-topic"
                >
                  {submittingTopic ? "Criando..." : "Publicar Discussão"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
