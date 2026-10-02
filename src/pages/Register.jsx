import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Auth.module.css";

export default function Register() {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      return setError("As senhas não coincidem.");
    }
    if (password.length < 6) {
      return setError("A senha deve ter ao menos 6 caracteres.");
    }
    try {
      setError("");
      setLoading(true);
      // Usa o apelido como displayName; se vazio, usa o primeiro nome
      const displayName = nickname.trim() || name.trim().split(" ")[0];
      await register(email, password, displayName);
      navigate("/");
    } catch (err) {
      setError(
        err.code === "auth/email-already-in-use"
          ? "Este e-mail já está em uso."
          : "Erro ao criar conta. Tente novamente."
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

        <h2 className={styles.formTitle}>Criar conta</h2>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="reg-name">Nome completo</label>
            <input
              id="reg-name"
              type="text"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="reg-nickname">
              Apelido <span className={styles.fieldHint}>(aparece na tela principal)</span>
            </label>
            <input
              id="reg-nickname"
              type="text"
              placeholder="Ex: Thiago, Thi, ThiCinema..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="reg-email">E-mail</label>
            <input
              id="reg-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="reg-password">Senha</label>
            <input
              id="reg-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="reg-confirm">Confirmar senha</label>
            <input
              id="reg-confirm"
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            id="btn-register"
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className={styles.switchLink}>
          Já tem conta?{" "}
          <Link to="/login" id="link-to-login">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
