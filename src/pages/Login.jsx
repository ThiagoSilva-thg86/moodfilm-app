import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Auth.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      setMessage("");
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

  async function handleResetSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      setMessage("");
      setLoading(true);
      await resetPassword(resetEmail);
      setMessage(
        "Se este e-mail estiver cadastrado em nossa base, enviamos um link com as instruções para redefinição de senha. Verifique sua caixa de entrada e a pasta de spam."
      );
    } catch (err) {
      if (err.code === "auth/invalid-email") {
        setError("Por favor, insira um endereço de e-mail válido.");
      } else if (err.code === "auth/user-not-found") {
        // Previne enumeração de usuários caso a proteção não esteja ativa no Firebase Console
        setMessage(
          "Se este e-mail estiver cadastrado em nossa base, enviamos um link com as instruções para redefinição de senha. Verifique sua caixa de entrada e a pasta de spam."
        );
      } else if (err.code === "auth/too-many-requests") {
        setError("Muitas tentativas em sequência. Por favor, aguarde alguns instantes antes de tentar novamente.");
      } else {
        setError("Ocorreu um erro ao processar o pedido. Tente novamente mais tarde.");
      }
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

        {isResetMode ? (
          <div>
            <h2 className={styles.formTitle}>Recuperar Senha</h2>
            <p className={styles.instructions}>
              Digite o e-mail associado à sua conta para receber o link de redefinição.
            </p>

            {error && <div className={styles.errorBox}>{error}</div>}
            {message && <div className={styles.successBox}>{message}</div>}

            {!message && (
              <form onSubmit={handleResetSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="reset-email">E-mail</label>
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <button
                  id="btn-send-reset"
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar instruções"}
                </button>
              </form>
            )}

            <div className={styles.backRow}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => {
                  setIsResetMode(false);
                  setError("");
                  setMessage("");
                }}
              >
                ← Voltar para o login
              </button>
            </div>
          </div>
        ) : (
          <>
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
                <div className={styles.labelRow}>
                  <label htmlFor="login-password">Senha</label>
                  <button
                    id="btn-forgot-password"
                    type="button"
                    className={styles.forgotBtn}
                    onClick={() => {
                      setIsResetMode(true);
                      setResetEmail(email);
                      setError("");
                      setMessage("");
                    }}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className={styles.passwordWrapper}>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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
          </>
        )}
      </div>
    </div>
  );
}
