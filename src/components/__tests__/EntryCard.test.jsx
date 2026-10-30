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

  it("deve renderizar o título, nota feeling e humor principal", () => {
    render(<EntryCard entry={mockEntry} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("O Senhor dos Anéis")).toBeInTheDocument();
    expect(screen.getByText("9.8")).toBeInTheDocument();
    expect(screen.getByText(/Obra-prima/i)).toBeInTheDocument();
    expect(screen.getByText(/Filme/i)).toBeInTheDocument();
    expect(screen.getByText("Assistido")).toBeInTheDocument();
  });

  it("deve disparar os callbacks de editar e excluir ao clicar nos respectivos botões", () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <EntryCard
        entry={mockEntry}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    const editBtn = screen.getByRole("button", { name: /Editar/i });
    const deleteBtn = screen.getByRole("button", { name: /Excluir/i });

    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
});
