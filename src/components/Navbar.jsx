import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Navegação principal">
      <div className={styles.inner}>
        <div className={styles.brandGroup}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandIcon}>🎬</span>
            <span className={styles.brandName}>MoodFilm</span>
          </Link>

          <div className={styles.navLinks}>
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

        <div className={styles.userArea}>
          <div className={styles.avatar} aria-hidden="true">
            {(currentUser?.displayName || currentUser?.email || "U")[0].toUpperCase()}
          </div>
          <span className={styles.userName}>
            {currentUser?.displayName || currentUser?.email}
          </span>
          <button id="btn-logout" className={styles.logoutBtn} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
