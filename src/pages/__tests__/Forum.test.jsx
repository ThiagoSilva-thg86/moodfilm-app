import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Forum from "../Forum";

// Mock do contexto de autenticação
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    currentUser: {
      uid: "user_123",
      displayName: "Thiagão",
      email: "test@test.com",
    },
    logout: vi.fn(),
  }),
}));

// Mock do serviço do fórum
vi.mock("../../services/forumService", () => ({
  FORUM_CATEGORIES: [
    { id: "all", label: "🌟 Todas as Discussões" },
    { id: "geral", label: "🎬 Geral & Bate-papo", icon: "🎬" },
    { id: "teorias", label: "🎭 Teorias & Spoilers", icon: "🎭" },
  ],
  createTopic: vi.fn(),
  subscribeToTopics: vi.fn((callback) => {
    callback([
      {
        id: "topico_1",
        title: "Discussão sobre Parasita",
        category: "teorias",
        authorId: "user_123",
        authorNickname: "Thiagão",
        replyCount: 3,
        createdAtClient: Date.now(),
      },
    ]);
    return () => {};
  }),
  subscribeToComments: vi.fn((topicId, callback) => {
    callback([
      {
        id: "comentario_1",
        text: "Filme maravilhoso!",
        authorNickname: "Thiagão",
        authorId: "user_123",
        createdAtClient: Date.now(),
        isOriginalPost: true,
      },
    ]);
    return () => {};
  }),
  addComment: vi.fn(),
  deleteTopic: vi.fn(),
  deleteComment: vi.fn(),
}));

describe("Forum Page Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o banner da Comunidade e o botão de nova discussão", () => {
    render(
      <BrowserRouter>
        <Forum />
      </BrowserRouter>
    );

    expect(screen.getByText(/Comunidade MoodFilm/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ Nova Discussão/i })).toBeInTheDocument();
  });

  it("deve listar o tópico retornado pelo Realtime Database", () => {
    render(
      <BrowserRouter>
        <Forum />
      </BrowserRouter>
    );

    expect(screen.getByText("Discussão sobre Parasita")).toBeInTheDocument();
    expect(screen.getAllByText("Thiagão").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/3 mensagens/i)).toBeInTheDocument();
  });
});
