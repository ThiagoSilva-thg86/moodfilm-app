import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Navbar from "../Navbar";

const mockLogout = vi.fn();

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    currentUser: {
      displayName: "Thiago",
      email: "thiago@teste.com",
    },
    logout: mockLogout,
  }),
}));

describe("Navbar Component", () => {
  it("deve renderizar a logo e os links de navegação principais", () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText("MoodFilm")).toBeInTheDocument();
    expect(screen.getByText(/Diário/i)).toBeInTheDocument();
    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
    expect(screen.getByText("Thiago")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sair/i })).toBeInTheDocument();
  });

  it("deve chamar a função de logout ao clicar no botão Sair", async () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const logoutBtn = screen.getByRole("button", { name: /Sair/i });
    fireEvent.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
