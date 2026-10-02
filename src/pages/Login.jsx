import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Auth.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential"
          ? "E-mail ou senha incorretos."
          : "Erro ao entrar. Verifique suas credenciais."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎬</span>
          <h1 className={styles.logoText}>MoodFilm</h1>
          <p className={styles.logoSub}>Seu diário de filmes e humor</p>
        </div>

        <h2 className={styles.formTitle}>Entrar</h2>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="btn-login"
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className={styles.switchLink}>
          Não tem conta?{" "}
          <Link to="/register" id="link-to-register">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
