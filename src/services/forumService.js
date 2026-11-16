import {
  ref,
  push,
  set,
  onValue,
  off,
  serverTimestamp,
  update,
  remove,
} from "firebase/database";
import { rtdb } from "../firebase/config";

/**
 * Categorias temáticas da Comunidade / Fórum MoodFilm
 */
export const FORUM_CATEGORIES = [
  { id: "all", label: "🌟 Todas as Discussões" },
  { id: "geral", label: "🎬 Geral & Bate-papo", icon: "🎬" },
  { id: "recomendacoes", label: "💡 Recomendações", icon: "💡" },
  { id: "teorias", label: "🎭 Teorias & Spoilers", icon: "🎭" },
  { id: "lancamentos", label: "🍿 Lançamentos & Críticas", icon: "🍿" },
  { id: "animacao", label: "🎨 Animação & Estilos", icon: "🎨" },
];

/**
 * Cria um novo tópico de discussão no Realtime Database.
 * Também cria o primeiro comentário (post de abertura) na coleção de comentários do tópico.
 *
 * @param {Object} params
 * @param {string} params.title - Título do tópico
 * @param {string} params.category - Categoria (ex: "geral", "teorias")
 * @param {string} params.content - Conteúdo/texto de abertura da discussão
 * @param {string} params.authorId - UID do autor
 * @param {string} params.authorNickname - Apelido do autor
 * @returns {Promise<string>} Retorna o ID do tópico criado
 */
export async function createTopic({
  title,
  category = "geral",
  content,
  authorId,
  authorNickname,
}) {
  const trimmedTitle = (title || "").trim();
  const trimmedContent = (content || "").trim();

  if (!trimmedTitle) {
    throw new Error("O título da discussão é obrigatório.");
  }
  if (!trimmedContent) {
    throw new Error("A mensagem inicial é obrigatória.");
  }
  if (!authorId) {
    throw new Error("Usuário não autenticado.");
  }

  // 1. Gera uma nova chave única para o tópico em /topics
  const topicsRef = ref(rtdb, "topics");
  const newTopicRef = push(topicsRef);
  const topicId = newTopicRef.key;

  const now = Date.now();

  const topicData = {
    id: topicId,
    title: trimmedTitle,
    category: category || "geral",
    authorId,
    authorNickname: authorNickname || "Cinéfilo",
    createdAt: serverTimestamp(),
    createdAtClient: now,
    replyCount: 1, // Começa com 1 (a própria mensagem de abertura)
    lastActivityAt: now,
    lastActivityBy: authorNickname || "Cinéfilo",
  };

  // 2. Cria o primeiro comentário em /comments/{topicId}
  const commentsRef = ref(rtdb, `comments/${topicId}`);
  const firstCommentRef = push(commentsRef);
  const firstCommentData = {
    id: firstCommentRef.key,
    topicId,
    text: trimmedContent,
    authorId,
    authorNickname: authorNickname || "Cinéfilo",
    createdAt: serverTimestamp(),
    createdAtClient: now,
    isOriginalPost: true,
  };

  // Salva o tópico e a primeira mensagem
  await set(newTopicRef, topicData);
  await set(firstCommentRef, firstCommentData);

  return topicId;
}

/**
 * Escuta todos os tópicos em tempo real via WebSocket do Realtime Database.
 * Sempre que um tópico for criado, editado ou receber comentários, o callback é chamado.
 *
 * @param {Function} callback - Recebe a lista ordenada de tópicos
 * @returns {Function} Função de unsubscribe para parar de escutar
 */
export function subscribeToTopics(callback) {
  const topicsRef = ref(rtdb, "topics");

  const listener = onValue(
    topicsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const data = snapshot.val() || {};
      // Converte o objeto em array e ordena pelos mais recentes / última atividade
      const list = Object.keys(data).map((key) => ({
        ...data[key],
        id: key,
      }));

      list.sort((a, b) => {
        const timeA = a.lastActivityAt || a.createdAtClient || 0;
        const timeB = b.lastActivityAt || b.createdAtClient || 0;
        return timeB - timeA;
      });

      callback(list);
    },
    (error) => {
      console.error("Erro ao escutar tópicos no Realtime Database:", error);
      callback([]);
    }
  );

  // Retorna a função de cleanup
  return () => off(topicsRef, "value", listener);
}

/**
 * Escuta os comentários de um tópico específico em tempo real.
 *
 * @param {string} topicId - ID do tópico
 * @param {Function} callback - Recebe a lista ordenada de comentários
 * @returns {Function} Função de cleanup (unsubscribe)
 */
export function subscribeToComments(topicId, callback) {
  if (!topicId) return () => {};

  const commentsRef = ref(rtdb, `comments/${topicId}`);

  const listener = onValue(
    commentsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const data = snapshot.val() || {};
      const list = Object.keys(data).map((key) => ({
        ...data[key],
        id: key,
      }));

      // Ordena cronologicamente (do mais antigo para o mais novo)
      list.sort((a, b) => {
        const timeA = a.createdAtClient || 0;
        const timeB = b.createdAtClient || 0;
        return timeA - timeB;
      });

      callback(list);
    },
    (error) => {
      console.error("Erro ao escutar comentários:", error);
      callback([]);
    }
  );

  return () => off(commentsRef, "value", listener);
}

/**
 * Envia um novo comentário para o tópico e atualiza a última atividade do tópico.
 *
 * @param {string} topicId - ID do tópico
 * @param {Object} params
 * @param {string} params.text - Mensagem
 * @param {string} params.authorId - UID do autor
 * @param {string} params.authorNickname - Apelido do autor
 * @param {number} params.currentReplyCount - Contagem atual de respostas
 */
export async function addComment(
  topicId,
  { text, authorId, authorNickname, currentReplyCount = 0 }
) {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    throw new Error("A mensagem não pode ficar vazia.");
  }
  if (!topicId) {
    throw new Error("Tópico inválido.");
  }
  if (!authorId) {
    throw new Error("Usuário não autenticado.");
  }

  const now = Date.now();
  const commentsRef = ref(rtdb, `comments/${topicId}`);
  const newCommentRef = push(commentsRef);

  const commentData = {
    id: newCommentRef.key,
    topicId,
    text: trimmed,
    authorId,
    authorNickname: authorNickname || "Cinéfilo",
    createdAt: serverTimestamp(),
    createdAtClient: now,
  };

  // 1. Grava o comentário
  await set(newCommentRef, commentData);

  // 2. Atualiza a contagem e última atividade no tópico pai
  const topicRef = ref(rtdb, `topics/${topicId}`);
  await update(topicRef, {
    replyCount: (currentReplyCount || 0) + 1,
    lastActivityAt: now,
    lastActivityBy: authorNickname || "Cinéfilo",
  });

  return newCommentRef.key;
}

/**
 * Remove um tópico inteiro e todos os seus comentários associados.
 * Apenas o autor original tem essa permissão.
 */
export async function deleteTopic(topicId) {
  if (!topicId) return;
  const topicRef = ref(rtdb, `topics/${topicId}`);
  const commentsRef = ref(rtdb, `comments/${topicId}`);

  await remove(topicRef);
  await remove(commentsRef);
}

/**
 * Remove um comentário específico.
 */
export async function deleteComment(topicId, commentId, currentReplyCount = 1) {
  if (!topicId || !commentId) return;
  const commentRef = ref(rtdb, `comments/${topicId}/${commentId}`);
  await remove(commentRef);

  const topicRef = ref(rtdb, `topics/${topicId}`);
  await update(topicRef, {
    replyCount: Math.max(1, (currentReplyCount || 1) - 1),
  });
}
