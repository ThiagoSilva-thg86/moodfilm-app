import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EntryModal from "../EntryModal";

// Mock TMDB service
vi.mock("../../services/tmdbService", () => ({
  searchMovies: vi.fn().mockResolvedValue([]),
  searchSeries: vi.fn().mockResolvedValue([]),
  getMovieDetails: vi.fn().mockResolvedValue({}),
  getSeriesDetails: vi.fn().mockResolvedValue({}),
}));

describe("EntryModal Component", () => {
  const mockEntry = {
    id: "entry-1",
    title: "Interestelar",
    type: "Filme",
    status: "Assistido",
    rating: 10,
    technicalRatings: {
      script: 5,
      acting: 5,
      direction: 5,
      technical: 5,
      soundtrack: 5,
    },
    moods: ["🤩 Obra-prima"],
    genres: ["Sci-Fi", "Drama"],
    review: "Filme espetacular sobre amor e gravidade.",
  };

  it("deve abrir em modo de visualização (read-only) ao passar uma entrada existente", () => {
    render(
      <EntryModal
        entry={mockEntry}
        initialMode="view"
        genres={["Sci-Fi", "Drama"]}
        statusOptions={["Quero assistir", "Assistindo", "Assistido"]}
        moodOptions={[{ emoji: "🤩", label: "Obra-prima" }]}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // Deve exibir o título e notas sem campos de input abertos para edição
    expect(screen.getByText("Interestelar")).toBeInTheDocument();
    expect(screen.getByText(/10 \/ 10/i)).toBeInTheDocument();
    expect(screen.getByText(/Filme espetacular sobre amor e gravidade/i)).toBeInTheDocument();

    // Deve conter os botões de ícone de Editar e Excluir
    expect(screen.getByRole("button", { name: /^Editar$/i })).toBeInTheDocument();
  });

  it("deve alternar para o modo de edição ao clicar no ícone de lápis", () => {
    render(
      <EntryModal
        entry={mockEntry}
        initialMode="view"
        genres={["Sci-Fi", "Drama"]}
        statusOptions={["Quero assistir", "Assistindo", "Assistido"]}
        moodOptions={[{ emoji: "🤩", label: "Obra-prima" }]}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const editBtn = screen.getByRole("button", { name: /^Editar$/i });
    fireEvent.click(editBtn);

    // Agora o campo de título editável deve estar visível
    const titleInput = screen.getByLabelText(/Título \*/i);
    expect(titleInput).toBeInTheDocument();
    expect(titleInput.value).toBe("Interestelar");
  });

  it("deve disparar onDelete ao clicar no ícone de lixeira e confirmar", () => {
    const handleDelete = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <EntryModal
        entry={mockEntry}
        initialMode="view"
        genres={["Sci-Fi", "Drama"]}
        statusOptions={["Quero assistir", "Assistindo", "Assistido"]}
        moodOptions={[{ emoji: "🤩", label: "Obra-prima" }]}
        onSave={vi.fn()}
        onDelete={handleDelete}
        onClose={vi.fn()}
      />
    );

    const deleteBtn = screen.getByRole("button", { name: /^Excluir$/i });
    fireEvent.click(deleteBtn);

    expect(handleDelete).toHaveBeenCalledWith("entry-1");
  });
});
