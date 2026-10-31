import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EntryCard from "../EntryCard";

describe("EntryCard Component", () => {
  const mockEntry = {
    id: "entry-1",
    title: "O Senhor dos Anéis",
    type: "Filme",
    status: "Assistido",
    rating: 9.8,
    technicalScore: 4.9,
    moods: ["🤩 Obra-prima", "🔥 Fiquei eufórico"],
    genres: ["Fantasia", "Ação"],
    review: "Um clássico absoluto do cinema moderno.",
    year: "2001",
  };

  it("deve renderizar o título, nota feeling, humor principal e dica para ver detalhes", () => {
    render(<EntryCard entry={mockEntry} onSelect={vi.fn()} />);

    expect(screen.getByText("O Senhor dos Anéis")).toBeInTheDocument();
    expect(screen.getByText("9.8")).toBeInTheDocument();
    expect(screen.getByText(/Obra-prima/i)).toBeInTheDocument();
    expect(screen.getByText(/Filme/i)).toBeInTheDocument();
    expect(screen.getByText("Assistido")).toBeInTheDocument();
    expect(screen.getByText(/Toque para ver detalhes/i)).toBeInTheDocument();
  });

  it("deve disparar o callback onSelect ao clicar no card", () => {
    const handleSelect = vi.fn();

    render(
      <EntryCard
        entry={mockEntry}
        onSelect={handleSelect}
      />
    );

    const card = screen.getByRole("button", { name: /Ver detalhes de O Senhor dos Anéis/i });
    fireEvent.click(card);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(mockEntry);
  });
});
