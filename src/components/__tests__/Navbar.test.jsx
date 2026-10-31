import { describe, it, expect, vi, beforeEach } from "vitest";
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar a logo e o botão de menu hambúrguer", () => {
    const { container } = render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText("MoodFilm")).toBeInTheDocument();
    const hamburger = container.querySelector("#btn-mobile-menu");
    expect(hamburger).toBeInTheDocument();
  });

  it("deve abrir a gaveta (drawer) ao clicar no menu hambúrguer com todos os botões e links", () => {
    const { container } = render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const hamburger = container.querySelector("#btn-mobile-menu");
    fireEvent.click(hamburger);

    expect(screen.getByText("NAVEGAÇÃO")).toBeInTheDocument();
    expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
    expect(screen.getByText("thiago@teste.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair da conta/i })).toBeInTheDocument();
  });

  it("deve chamar a função de logout ao clicar no botão Sair da gaveta móvel", async () => {
    const { container } = render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const hamburger = container.querySelector("#btn-mobile-menu");
    fireEvent.click(hamburger);

    const drawerLogout = screen.getByRole("button", { name: /sair da conta/i });
    fireEvent.click(drawerLogout);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
