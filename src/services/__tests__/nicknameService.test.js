import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeNickname,
  validateNicknameFormat,
  isNicknameAvailable,
  claimNickname,
} from "../nicknameService";

// Mock do Firebase Firestore
vi.mock("../../firebase/config", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((db, collection, id) => ({ collection, id })),
  getDoc: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(() => "mock-timestamp"),
}));

import { getDoc, writeBatch } from "firebase/firestore";

describe("nicknameService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("normalizeNickname", () => {
    it("deve converter para letras minúsculas, remover espaços laterais e converter espaços internos para '_'", () => {
      expect(normalizeNickname("  Thiago  ")).toBe("thiago");
      expect(normalizeNickname("Tt MF")).toBe("tt_mf");
      expect(normalizeNickname("Cinefilo_86")).toBe("cinefilo_86");
      expect(normalizeNickname("MARLON-BRANDO")).toBe("marlon-brando");
    });

    it("deve retornar string vazia para valores nulos ou inválidos", () => {
      expect(normalizeNickname("")).toBe("");
      expect(normalizeNickname(null)).toBe("");
      expect(normalizeNickname(undefined)).toBe("");
    });
  });

  describe("validateNicknameFormat", () => {
    it("deve aprovar apelidos com tamanho entre 3 e 20 caracteres válidos, incluindo espaços simples", () => {
      expect(validateNicknameFormat("thiago").valid).toBe(true);
      expect(validateNicknameFormat("Tt MF").valid).toBe(true);
      expect(validateNicknameFormat("cine_filo").valid).toBe(true);
      expect(validateNicknameFormat("joao-10").valid).toBe(true);
    });

    it("deve rejeitar apelidos com menos de 3 caracteres", () => {
      const res = validateNicknameFormat("th");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("no mínimo 3 caracteres");
    });

    it("deve rejeitar apelidos com mais de 20 caracteres", () => {
      const res = validateNicknameFormat("nome_muito_longo_que_ultrapassa_vinte");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("no máximo 20 caracteres");
    });

    it("deve rejeitar apelidos com caracteres especiais proibidos ou múltiplos espaços", () => {
      expect(validateNicknameFormat("thi@cinema").valid).toBe(false);
      expect(validateNicknameFormat("user#123").valid).toBe(false);
      expect(validateNicknameFormat("Tt  MF").valid).toBe(false);
    });
  });

  describe("isNicknameAvailable (Consulta O(1) no Firestore)", () => {
    it("deve retornar available: true se o documento não existir no banco", async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const res = await isNicknameAvailable("novo_cinefilo");
      expect(res.available).toBe(true);
    });

    it("deve retornar available: false se o apelido já estiver em uso por outro usuário", async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ uid: "outro_usuario_id" }),
      });

      const res = await isNicknameAvailable("thiago", "meu_usuario_id");
      expect(res.available).toBe(false);
      expect(res.error).toContain("já está em uso");
    });

    it("deve retornar available: true e isCurrent: true se pertencer ao próprio usuário logado", async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ uid: "meu_usuario_id" }),
      });

      const res = await isNicknameAvailable("thiago", "meu_usuario_id");
      expect(res.available).toBe(true);
      expect(res.isCurrent).toBe(true);
    });

    it("deve barrar apelidos com formato inválido antes mesmo de consultar o banco", async () => {
      const res = await isNicknameAvailable("a!");
      expect(res.available).toBe(false);
      expect(getDoc).not.toHaveBeenCalled();
    });
  });

  describe("claimNickname (Gravação atômica em Batch)", () => {
    it("deve executar batch commit registrando a chave primária de apelido e perfil", async () => {
      // Mock de disponibilidade
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const mockBatch = {
        set: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(true),
      };
      writeBatch.mockReturnValueOnce(mockBatch);

      await claimNickname("user_123", "Thiago");

      expect(mockBatch.set).toHaveBeenCalledTimes(2); // usernames/{normalized} e users/{uid}
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it("deve deletar a chave antiga em batch caso o usuário esteja alterando o apelido", async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const mockBatch = {
        set: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(true),
      };
      writeBatch.mockReturnValueOnce(mockBatch);

      await claimNickname("user_123", "NovoApelido", "ApelidoAntigo");

      expect(mockBatch.delete).toHaveBeenCalledTimes(1);
      expect(mockBatch.set).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });
  });
});
