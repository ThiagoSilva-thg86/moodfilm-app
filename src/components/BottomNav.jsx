import { Link, useLocation } from "react-router-dom";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className={styles.bottomNav} aria-label="Navegação móvel principal">
      <Link
        to="/"
        className={`${styles.navItem} ${location.pathname === "/" ? styles.navItemActive : ""}`}
        id="bottom-nav-home"
      >
        <span className={styles.navIcon} aria-hidden="true">🎬</span>
        <span>Diário</span>
      </Link>

      <Link
        to="/analytics"
        className={`${styles.navItem} ${location.pathname === "/analytics" ? styles.navItemActive : ""}`}
        id="bottom-nav-analytics"
      >
        <span className={styles.navIcon} aria-hidden="true">📊</span>
        <span>Analytics</span>
      </Link>

      <Link
        to="/profile"
        className={`${styles.navItem} ${location.pathname === "/profile" ? styles.navItemActive : ""}`}
        id="bottom-nav-profile"
      >
        <span className={styles.navIcon} aria-hidden="true">⚙️</span>
        <span>Perfil</span>
      </Link>
    </nav>
  );
}
