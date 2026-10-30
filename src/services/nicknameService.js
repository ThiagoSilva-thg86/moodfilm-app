import {
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Normaliza o apelido para armazenamento e busca O(1) no Firestore.
 * Remove espaços nas pontas e converte para minúsculas para garantir
 * que "Thiago", "thiago" e "THIAGO" sejam tratados como o mesmo apelido.
 */
export function normalizeNickname(nickname) {
  if (!nickname || typeof nickname !== "string") return "";
  return nickname.trim().toLowerCase();
}

/**
 * Valida as regras de negócio de formato do apelido:
 * - Deve ter entre 3 e 20 caracteres
 * - Apenas letras (com ou sem acento), números, sublinhado (_) e hífen (-)
 * - Não pode conter espaços ou caracteres especiais proibidos
 */
export function validateNicknameFormat(nickname) {
  if (!nickname || typeof nickname !== "string") {
    return {
      valid: false,
      error: "O apelido é obrigatório.",
    };
  }

  const trimmed = nickname.trim();

  if (trimmed.length < 3) {
    return {
      valid: false,
      error: "O apelido deve ter no mínimo 3 caracteres.",
    };
  }

  if (trimmed.length > 20) {
    return {
      valid: false,
      error: "O apelido deve ter no máximo 20 caracteres.",
    };
  }

  // Permite letras, números, underscore e hífen
  const validRegex = /^[a-zA-Z0-9_\u00C0-\u00FF-]+$/;
  if (!validRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Use apenas letras, números, '_' ou '-'. Sem espaços ou símbolos.",
    };
  }

  return { valid: true, error: "" };
}

/**
 * Consulta O(1) de alta performance no Firestore para verificar disponibilidade.
 * Ao usar o próprio apelido normalizado como ID do documento na coleção "usernames",
 * eliminamos o scan em coleção inteira e queries não indexadas.
 *
 * @param {string} nickname - Apelido a ser verificado
 * @param {string|null} currentUserId - UID do usuário atual (se estiver alterando seu próprio perfil)
 * @returns {Promise<{ available: boolean, error?: string, isCurrent?: boolean }>}
 */
export async function isNicknameAvailable(nickname, currentUserId = null) {
  const validation = validateNicknameFormat(nickname);
  if (!validation.valid) {
    return { available: false, error: validation.error };
  }

  const normalized = normalizeNickname(nickname);

  try {
    const docRef = doc(db, "usernames", normalized);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { available: true };
    }

    const data = snap.data();
    // Se o apelido já pertence ao usuário atual, está disponível para ele manter
    if (currentUserId && data.uid === currentUserId) {
      return { available: true, isCurrent: true };
    }

    return {
      available: false,
      error: "Este apelido já está em uso por outro cinéfilo.",
    };
  } catch (err) {
    console.error("Erro ao verificar disponibilidade de apelido:", err);
    throw new Error("Não foi possível verificar o apelido no momento. Tente novamente.");
  }
}

/**
 * Registra ou atualiza um apelido garantindo a integridade no banco com Batch Write.
 * - Registra o documento em `usernames/{normalizedNickname}` apontando para o UID.
 * - Se houver apelido anterior diferente, remove o documento antigo de `usernames`.
 * - Atualiza o documento em `users/{userId}` com os dados de perfil.
 *
 * @param {string} userId - UID do usuário autenticado
 * @param {string} newNickname - Novo apelido
 * @param {string|null} oldNickname - Apelido anterior (se houver)
 */
export async function claimNickname(userId, newNickname, oldNickname = null) {
  const validation = validateNicknameFormat(newNickname);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newNormalized = normalizeNickname(newNickname);
  const oldNormalized = oldNickname ? normalizeNickname(oldNickname) : null;

  // Se for o mesmo apelido normalizado, nada precisa ser trocado na chave
  if (oldNormalized && oldNormalized === newNormalized) {
    return;
  }

  // Checa disponibilidade antes de executar a gravação
  const check = await isNicknameAvailable(newNickname, userId);
  if (!check.available) {
    throw new Error(check.error || "Apelido indisponível.");
  }

  const batch = writeBatch(db);

  // 1. Cria a nova chave primária de apelido
  const newUsernameRef = doc(db, "usernames", newNormalized);
  batch.set(newUsernameRef, {
    uid: userId,
    nickname: newNickname.trim(),
    normalized: newNormalized,
    createdAt: serverTimestamp(),
  });

  // 2. Se existia apelido anterior diferente, libera a chave antiga
  if (oldNormalized) {
    const oldUsernameRef = doc(db, "usernames", oldNormalized);
    batch.delete(oldUsernameRef);
  }

  // 3. Atualiza o perfil central do usuário
  const userRef = doc(db, "users", userId);
  batch.set(
    userRef,
    {
      nickname: newNickname.trim(),
      normalizedNickname: newNormalized,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}
