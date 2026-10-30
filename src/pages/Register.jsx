import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isNicknameAvailable } from "../services/nicknameService";
import styles from "./Auth.module.css";

export default function Register() {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState({
    checking: false,
    available: null,
    message: "",
  });
  const { register } = useAuth();
  const navigate = useNavigate();

  // Validação assíncrona do apelido com debounce no banco de dados Firestore
  useEffect(() => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameStatus({ checking: false, available: null, message: "" });
      return;
    }

    if (trimmed.length < 3) {
      setNicknameStatus({
        checking: false,
        available: false,
        message: "O apelido deve ter pelo menos 3 caracteres.",
      });
      return;
    }

    let active = true;
    setNicknameStatus({
      checking: true,
      available: null,
      message: "Consultando disponibilidade no banco...",
    });

    const timer = setTimeout(async () => {
      try {
        const res = await isNicknameAvailable(trimmed);
        if (!active) return;

        if (res.available) {
          setNicknameStatus({
            checking: false,
            available: true,
            message: "✓ Apelido disponível!",
          });
        } else {
          setNicknameStatus({
            checking: false,
            available: false,
            message: res.error || "Este apelido já está em uso.",
          });
        }
      } catch (err) {
        if (!active) return;
        setNicknameStatus({
          checking: false,
          available: false,
          message: "Erro ao consultar apelido.",
        });
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [nickname]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      return setError("As senhas não coincidem.");
    }
    if (password.length < 6) {
      return setError("A senha deve ter ao menos 6 caracteres.");
    }
    if (!nickname.trim()) {
      return setError("Por favor, defina um apelido exclusivo.");
    }
    if (nicknameStatus.available === false) {
      return setError(nicknameStatus.message || "Apelido inválido ou indisponível.");
    }

    try {
      setError("");
      setLoading(true);
      const chosenNickname = nickname.trim();
      await register(email, password, chosenNickname, chosenNickname);
      navigate("/");
    } catch (err) {
      setError(
        err.message?.includes("apelido")
          ? err.message
          : err.code === "auth/email-already-in-use"
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
            <div className={styles.fieldLabelRow}>
              <label htmlFor="reg-nickname">
                Apelido <span className={styles.fieldHint}>(único no sistema)</span>
              </label>
              {nicknameStatus.checking && (
                <span className={styles.nicknameChecking}>Verificando...</span>
              )}
              {!nicknameStatus.checking && nicknameStatus.available === true && (
                <span className={styles.nicknameAvailable}>✓ Disponível</span>
              )}
              {!nicknameStatus.checking && nicknameStatus.available === false && (
                <span className={styles.nicknameUnavailable}>✗ Indisponível</span>
              )}
            </div>
            <input
              id="reg-nickname"
              type="text"
              placeholder="Ex: Thiago, Thi, ThiCinema..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              autoComplete="nickname"
              className={
                nicknameStatus.available === true
                  ? styles.inputSuccess
                  : nicknameStatus.available === false
                  ? styles.inputError
                  : ""
              }
            />
            {nicknameStatus.message && (
              <p
                className={
                  nicknameStatus.available === true
                    ? styles.fieldFeedbackSuccess
                    : styles.fieldFeedbackError
                }
              >
                {nicknameStatus.message}
              </p>
            )}
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
            <div className={styles.passwordWrapper}>
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="reg-confirm">Confirmar senha</label>
            <div className={styles.passwordWrapper}>
              <input
                id="reg-confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Ocultar senha" : "Ver senha"}
                title={showConfirm ? "Ocultar senha" : "Ver senha"}
              >
                {showConfirm ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
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
