import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Register from "../Register";

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../services/nicknameService", () => ({
  isNicknameAvailable: vi.fn(async (nick) => {
    if (nick === "ocupado") {
      return { available: false, error: "Este apelido já está em uso por outro cinéfilo." };
    }
    return { available: true };
  }),
}));

describe("Register Page Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o formulário com todos os campos necessários", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Apelido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmar senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Criar conta/i })).toBeInTheDocument();
  });

  it("deve exibir erro caso as senhas digitadas não coincidam", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const form = screen.getByRole("button", { name: /Criar conta/i }).closest("form");

    fireEvent.change(screen.getByLabelText(/Nome completo/i), { target: { value: "Thiago Silva" } });
    fireEvent.change(screen.getByLabelText(/Apelido/i), { target: { value: "thiagocine" } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: "thiago@teste.com" } });
    fireEvent.change(screen.getByLabelText(/^Senha/i), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText(/Confirmar senha/i), { target: { value: "654321" } });

    fireEvent.submit(form);

    expect(await screen.findByText(/As senhas não coincidem/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("deve alertar se a senha tiver menos de 6 caracteres", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const form = screen.getByRole("button", { name: /Criar conta/i }).closest("form");

    fireEvent.change(screen.getByLabelText(/Nome completo/i), { target: { value: "Thiago Silva" } });
    fireEvent.change(screen.getByLabelText(/Apelido/i), { target: { value: "thiagocine" } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: "thiago@teste.com" } });
    fireEvent.change(screen.getByLabelText(/^Senha/i), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText(/Confirmar senha/i), { target: { value: "123" } });

    fireEvent.submit(form);

    expect(await screen.findByText(/A senha deve ter ao menos 6 caracteres/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("deve checar e exibir feedback visual quando o apelido estiver disponível", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const nickInput = screen.getByLabelText(/Apelido/i);
    fireEvent.change(nickInput, { target: { value: "cinematografo" } });

    await waitFor(() => {
      expect(screen.getByText(/✓ Apelido disponível!/i)).toBeInTheDocument();
    });
  });

  it("deve alertar e impedir submissão caso o apelido já esteja ocupado no banco", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const form = screen.getByRole("button", { name: /Criar conta/i }).closest("form");
    const nickInput = screen.getByLabelText(/Apelido/i);
    fireEvent.change(nickInput, { target: { value: "ocupado" } });

    await waitFor(() => {
      const messages = screen.getAllByText(/já está em uso/i);
      expect(messages.length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.change(screen.getByLabelText(/Nome completo/i), { target: { value: "Outro Thiago" } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: "outro@teste.com" } });
    fireEvent.change(screen.getByLabelText(/^Senha/i), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText(/Confirmar senha/i), { target: { value: "123456" } });

    fireEvent.submit(form);

    await waitFor(() => {
      const messages = screen.getAllByText(/já está em uso/i);
      expect(messages.length).toBeGreaterThanOrEqual(1);
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
