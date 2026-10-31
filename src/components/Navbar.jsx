import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Fecha o menu ao navegar para outra página
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Fecha o menu ao pressionar a tecla ESC
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Impede scroll do fundo
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  }

  const userInitial = (currentUser?.displayName || currentUser?.email || "U")[0].toUpperCase();
  const userDisplay = currentUser?.displayName || currentUser?.email;

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Navegação principal">
      <div className={styles.inner}>
        {/* Marca / Logo */}
        <div className={styles.brandGroup}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandIcon} aria-hidden="true">🎬</span>
            <span className={styles.brandName}>MoodFilm</span>
          </Link>

          {/* Links Desktop */}
          <div className={styles.desktopNavLinks}>
            <Link
              to="/"
              className={`${styles.navLink} ${location.pathname === "/" ? styles.navLinkActive : ""}`}
            >
              🎬 Diário
            </Link>
            <Link
              to="/analytics"
              className={`${styles.navLink} ${location.pathname === "/analytics" ? styles.navLinkActive : ""}`}
            >
              📊 Analytics
            </Link>
          </div>
        </div>

        {/* Área do Usuário Desktop */}
        <div className={styles.desktopUserArea}>
          <div className={styles.userProfileWrapper}>
            <Link
              to="/profile"
              className={`${styles.userProfileLink} ${location.pathname === "/profile" ? styles.userProfileLinkActive : ""}`}
              id="btn-user-profile"
              title="Gerenciar seu perfil e configurações de conta"
            >
              <div className={styles.avatar} aria-hidden="true">
                {userInitial}
              </div>
              <span className={styles.userName}>
                {userDisplay}
              </span>
              <span className={styles.gearIcon}>⚙️</span>
            </Link>

            <div className={styles.tooltipBox}>
              Gerenciar seu perfil e configurações de conta
            </div>
          </div>

          <button id="btn-logout" className={styles.logoutBtn} onClick={handleLogout} title="Sair da conta">
            Sair
          </button>
        </div>

        {/* Botão Menu Hambúrguer (Mobile) */}
        <button
          type="button"
          className={`${styles.hamburgerBtn} ${menuOpen ? styles.hamburgerActive : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu principal"}
          aria-expanded={menuOpen}
          aria-controls="mobile-drawer"
          id="btn-mobile-menu"
        >
          <span className={styles.burgerBar} />
          <span className={styles.burgerBar} />
          <span className={styles.burgerBar} />
        </button>
      </div>

      {/* Backdrop com desfoque */}
      {menuOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Gaveta Lateral Deslizante (Slide-over Drawer) */}
      <aside
        id="mobile-drawer"
        className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ""}`}
        aria-label="Menu móvel"
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerUserCard}>
            <div className={styles.drawerAvatar}>{userInitial}</div>
            <div className={styles.drawerUserInfo}>
              <strong className={styles.drawerUserName}>{userDisplay}</strong>
              <span className={styles.drawerUserEmail}>{currentUser?.email}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.drawerCloseBtn}
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        <div className={styles.drawerBody}>
          <div className={styles.drawerSectionTitle}>NAVEGAÇÃO</div>

          <Link
            to="/"
            className={`${styles.drawerLink} ${location.pathname === "/" ? styles.drawerLinkActive : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <span className={styles.drawerIcon}>🎬</span>
            <div className={styles.drawerLinkText}>
              <strong>Diário</strong>
              <small>Lista de filmes e séries assistidos</small>
            </div>
          </Link>

          <Link
            to="/analytics"
            className={`${styles.drawerLink} ${location.pathname === "/analytics" ? styles.drawerLinkActive : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <span className={styles.drawerIcon}>📊</span>
            <div className={styles.drawerLinkText}>
              <strong>Analytics & Humor</strong>
              <small>14 visões e estatísticas pessoais</small>
            </div>
          </Link>

          <Link
            to="/profile"
            className={`${styles.drawerLink} ${location.pathname === "/profile" ? styles.drawerLinkActive : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <span className={styles.drawerIcon}>⚙️</span>
            <div className={styles.drawerLinkText}>
              <strong>Meu Perfil</strong>
              <small>Alterar apelido, e-mail e senha</small>
            </div>
          </Link>
        </div>

        <div className={styles.drawerFooter}>
          <button
            type="button"
            className={styles.drawerLogoutBtn}
            onClick={handleLogout}
            id="btn-drawer-logout"
          >
            🚪 Sair da conta
          </button>
        </div>
      </aside>
    </nav>
  );
}
