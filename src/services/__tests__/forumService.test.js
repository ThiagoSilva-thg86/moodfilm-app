import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTopic,
  addComment,
  deleteTopic,
  deleteComment,
  FORUM_CATEGORIES,
} from "../forumService";

vi.mock("../../firebase/config", () => ({
  rtdb: {},
}));

vi.mock("firebase/database", () => ({
  ref: vi.fn((rtdb, path) => ({ path })),
  push: vi.fn((refObj) => ({ key: "mock-key-123", path: refObj.path })),
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
  serverTimestamp: vi.fn(() => "mock-timestamp"),
}));

import { set, update, remove } from "firebase/database";

describe("forumService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("FORUM_CATEGORIES", () => {
    it("deve conter categorias essenciais do fórum cinéfilo", () => {
      expect(FORUM_CATEGORIES.length).toBeGreaterThanOrEqual(5);
      expect(FORUM_CATEGORIES.some((c) => c.id === "geral")).toBe(true);
      expect(FORUM_CATEGORIES.some((c) => c.id === "recomendacoes")).toBe(true);
    });
  });

  describe("createTopic", () => {
    it("deve criar um tópico e o primeiro comentário no Realtime Database", async () => {
      const topicId = await createTopic({
        title: "O que acharam de Interestelar?",
        category: "teorias",
        content: "Aquele final na quinta dimensão foi incrível!",
        authorId: "user_789",
        authorNickname: "Thiagão",
      });

      expect(topicId).toBe("mock-key-123");
      expect(set).toHaveBeenCalledTimes(2); // Salva tópico e salva 1º comentário
    });

    it("deve lançar erro se o título for vazio", async () => {
      await expect(
        createTopic({
          title: "",
          content: "Conteúdo qualquer",
          authorId: "user_789",
        })
      ).rejects.toThrow("O título da discussão é obrigatório.");
    });

    it("deve lançar erro se o conteúdo for vazio", async () => {
      await expect(
        createTopic({
          title: "Título Válido",
          content: "   ",
          authorId: "user_789",
        })
      ).rejects.toThrow("A mensagem inicial é obrigatória.");
    });
  });

  describe("addComment", () => {
    it("deve salvar comentário e incrementar contagem de respostas no tópico pai", async () => {
      const commentId = await addComment("topic_abc", {
        text: "Também achei sensacional!",
        authorId: "user_456",
        authorNickname: "Cinefilo",
        currentReplyCount: 1,
      });

      expect(commentId).toBe("mock-key-123");
      expect(set).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          replyCount: 2,
        })
      );
    });

    it("deve barrar mensagem vazia", async () => {
      await expect(
        addComment("topic_abc", {
          text: "",
          authorId: "user_456",
        })
      ).rejects.toThrow("A mensagem não pode ficar vazia.");
    });
  });

  describe("deleteTopic & deleteComment", () => {
    it("deve remover nó do tópico e nó de comentários associados", async () => {
      await deleteTopic("topic_abc");
      expect(remove).toHaveBeenCalledTimes(2);
    });

    it("deve remover comentário e decrementar contagem no tópico pai", async () => {
      await deleteComment("topic_abc", "comment_xyz", 3);
      expect(remove).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          replyCount: 2,
        })
      );
    });
  });
});
