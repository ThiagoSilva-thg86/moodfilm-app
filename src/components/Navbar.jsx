import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Navegação principal">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🎬</span>
          <span className={styles.brandName}>MoodFilm</span>
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
