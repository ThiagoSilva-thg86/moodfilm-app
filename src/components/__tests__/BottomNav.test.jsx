import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import BottomNav from "../BottomNav";

describe("BottomNav Component", () => {
  it("deve renderizar os links de navegação inferior com ícones e textos", () => {
    const { container } = render(
      <BrowserRouter>
        <BottomNav />
      </BrowserRouter>
    );

    const homeLink = container.querySelector("#bottom-nav-home");
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveTextContent("Diário");

    const analyticsLink = container.querySelector("#bottom-nav-analytics");
    expect(analyticsLink).toBeInTheDocument();
    expect(analyticsLink).toHaveAttribute("href", "/analytics");
    expect(analyticsLink).toHaveTextContent("Analytics");

    const profileLink = container.querySelector("#bottom-nav-profile");
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute("href", "/profile");
    expect(profileLink).toHaveTextContent("Perfil");
  });
});
