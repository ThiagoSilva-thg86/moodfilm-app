import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isNicknameAvailable, validateNicknameFormat } from "../services/nicknameService";
import Navbar from "../components/Navbar";
import styles from "./Profile.module.css";

// Componente auxiliar de Input com botão do Olhinho (mostrar/ocultar senha)
function PasswordInput({ id, value, onChange, placeholder, required = true }) {
  const [show, setShow] = useState(false);

  return (
    <div className={styles.passwordWrapper}>
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete="current-password"
      />
      <button
        type="button"
        className={styles.eyeBtn}
        onClick={() => setShow(!show)}
        aria-label={show ? "Ocultar senha" : "Ver senha"}
        title={show ? "Ocultar senha" : "Ver senha"}
      >
        {show ? (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

export default function Profile() {
  const { currentUser, updateUserNickname, updateUserEmail, updateUserPassword } = useAuth();

  // Estados de formulário
  const [nickname, setNickname] = useState(currentUser?.displayName || "");
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Mensagens de status individuais por seção
  const [nameStatus, setNameStatus] = useState({ error: "", success: "", loading: false });
  const [nickAvailability, setNickAvailability] = useState({ checking: false, available: null, message: "" });
  const [emailStatus, setEmailStatus] = useState({ error: "", success: "", loading: false });
  const [passStatus, setPassStatus] = useState({ error: "", success: "", loading: false });

  // Validação assíncrona O(1) de apelido no Firestore ao digitar
  useEffect(() => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNickAvailability({ checking: false, available: null, message: "" });
      return;
    }

    if (trimmed === currentUser?.displayName) {
      setNickAvailability({ checking: false, available: true, message: "Este é seu apelido atual." });
      return;
    }

    const fmt = validateNicknameFormat(trimmed);
    if (!fmt.valid) {
      setNickAvailability({ checking: false, available: false, message: fmt.error });
      return;
    }

    let active = true;
    setNickAvailability({ checking: true, available: null, message: "Consultando banco de dados..." });

    const timer = setTimeout(async () => {
      try {
        const res = await isNicknameAvailable(trimmed, currentUser?.uid);
        if (!active) return;
        if (res.available) {
          setNickAvailability({ checking: false, available: true, message: "✓ Apelido disponível!" });
        } else {
          setNickAvailability({ checking: false, available: false, message: res.error || "Apelido indisponível." });
        }
      } catch (err) {
        if (!active) return;
        setNickAvailability({ checking: false, available: false, message: "Erro ao checar apelido." });
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [nickname, currentUser?.displayName, currentUser?.uid]);

  // 1. Atualizar Apelido
  async function handleUpdateNickname(e) {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      return setNameStatus({ error: "O apelido não pode ficar em branco.", success: "", loading: false });
    }
    if (trimmed === currentUser?.displayName) {
      return setNameStatus({ error: "Você já está usando este apelido.", success: "", loading: false });
    }
    if (nickAvailability.available === false) {
      return setNameStatus({ error: nickAvailability.message || "Apelido inválido ou em uso.", success: "", loading: false });
    }
    try {
      setNameStatus({ error: "", success: "", loading: true });
      await updateUserNickname(trimmed);
      setNameStatus({ error: "", success: "Apelido atualizado com sucesso no banco de dados!", loading: false });
    } catch (err) {
      console.error("Erro ao atualizar apelido:", err);
      const msg = err.message || "";
      setNameStatus({
        error: msg.includes("permission-denied")
          ? "Erro de permissão no banco de dados. Tente novamente."
          : msg || "Erro ao atualizar apelido. Tente novamente.",
        success: "",
        loading: false,
      });
    }
  }

  // 2. Atualizar E-mail (com senha atual)
  async function handleUpdateEmail(e) {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) {
      return setEmailStatus({ error: "Informe um e-mail válido.", success: "", loading: false });
    }
    if (!emailCurrentPassword) {
      return setEmailStatus({ error: "Informe sua senha atual para autorizar a troca de e-mail.", success: "", loading: false });
    }
    try {
      setEmailStatus({ error: "", success: "", loading: true });
      await updateUserEmail(newEmail.trim(), emailCurrentPassword);
      setEmailStatus({ error: "", success: "E-mail alterado com sucesso!", loading: false });
      setNewEmail("");
      setEmailCurrentPassword("");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setEmailStatus({ error: "Senha atual incorreta.", success: "", loading: false });
      } else if (err.code === "auth/email-already-in-use") {
        setEmailStatus({ error: "Este novo e-mail já está sendo utilizado.", success: "", loading: false });
      } else {
        setEmailStatus({ error: "Erro ao atualizar e-mail. Verifique suas credenciais.", success: "", loading: false });
      }
    }
  }

  // 3. Atualizar Senha (com senha atual)
  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (!currentPassword) {
      return setPassStatus({ error: "Informe sua senha atual.", success: "", loading: false });
    }
    if (newPassword.length < 6) {
      return setPassStatus({ error: "A nova senha deve ter no mínimo 6 caracteres.", success: "", loading: false });
    }
    if (newPassword !== confirmPassword) {
      return setPassStatus({ error: "A nova senha e a confirmação não coincidem.", success: "", loading: false });
    }
    try {
      setPassStatus({ error: "", success: "", loading: true });
      await updateUserPassword(newPassword, currentPassword);
      setPassStatus({ error: "", success: "Senha alterada com sucesso!", loading: false });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setPassStatus({ error: "Senha atual incorreta.", success: "", loading: false });
      } else if (err.code === "auth/weak-password") {
        setPassStatus({ error: "A nova senha é muito fraca.", success: "", loading: false });
      } else {
        setPassStatus({ error: "Erro ao atualizar senha. Verifique seus dados.", success: "", loading: false });
      }
    }
  }

  const initialLetter = (currentUser?.displayName || currentUser?.email || "U")[0].toUpperCase();

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.container}>
        {/* Cabeçalho do perfil */}
        <header className={styles.header}>
          <div className={styles.breadcrumb}>
            <Link to="/" className={styles.backLink}>← Voltar ao Diário</Link>
          </div>
          <div className={styles.profileHero}>
            <div className={styles.avatarLarge}>
              {initialLetter}
            </div>
            <div className={styles.profileHeroText}>
              <h1 className={styles.title}>Perfil & Configurações</h1>
              <p className={styles.subtitle}>
                Conta de <strong>{currentUser?.displayName || "Usuário"}</strong> · {currentUser?.email}
              </p>
            </div>
          </div>
        </header>

        {/* Banner informativo de segurança */}
        <div className={styles.securityBanner}>
          <span className={styles.shieldIcon}>🛡️</span>
          <div>
            <strong>Proteção de Conta Ativa:</strong>
            <p>
              Para alterar seu e-mail ou senha, é exigida a confirmação da sua <strong>senha atual</strong>.
              Isso impede alterações indevidas caso alguém acesse o app em um dispositivo compartilhado.
            </p>
          </div>
        </div>

        {/* Grade com os 3 cards de configurações */}
        <div className={styles.cardsGrid}>

          {/* CARD 1: APELIDO / NOME */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>👤</span>
              <div>
                <h3>Apelido de Exibição</h3>
                <p>Nome como você aparece no app e nos cards</p>
              </div>
            </div>

            {nameStatus.error && <div className={styles.errorBox}>{nameStatus.error}</div>}
            {nameStatus.success && <div className={styles.successBox}>{nameStatus.success}</div>}

            <form onSubmit={handleUpdateNickname} className={styles.form}>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label htmlFor="profile-nickname">Seu Apelido</label>
                  {nickAvailability.checking && (
                    <span className={styles.statusChecking}>Consultando...</span>
                  )}
                  {!nickAvailability.checking && nickAvailability.available === true && nickname.trim() !== currentUser?.displayName && (
                    <span className={styles.statusAvailable}>✓ Disponível</span>
                  )}
                  {!nickAvailability.checking && nickAvailability.available === false && (
                    <span className={styles.statusUnavailable}>✗ Indisponível</span>
                  )}
                </div>
                <input
                  id="profile-nickname"
                  type="text"
                  placeholder="Ex: Thiago, Cinéfilo86..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  autoComplete="nickname"
                  className={
                    nickAvailability.available === true && nickname.trim() !== currentUser?.displayName
                      ? styles.inputSuccess
                      : nickAvailability.available === false
                      ? styles.inputError
                      : ""
                  }
                />
                {nickAvailability.message && (
                  <p
                    className={
                      nickAvailability.available === true
                        ? styles.feedbackSuccess
                        : styles.feedbackError
                    }
                  >
                    {nickAvailability.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className={styles.saveBtn}
                disabled={
                  nameStatus.loading ||
                  nickAvailability.checking ||
                  nickAvailability.available === false ||
                  nickname.trim() === currentUser?.displayName
                }
              >
                {nameStatus.loading ? "Salvando no Banco..." : "Salvar Apelido"}
              </button>
            </form>
          </section>

          {/* CARD 2: E-MAIL */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>✉️</span>
              <div>
                <h3>Alterar E-mail</h3>
                <p>Atualize o endereço de acesso à sua conta</p>
              </div>
            </div>

            {emailStatus.error && <div className={styles.errorBox}>{emailStatus.error}</div>}
            {emailStatus.success && <div className={styles.successBox}>{emailStatus.success}</div>}

            <form onSubmit={handleUpdateEmail} className={styles.form}>
              <div className={styles.field}>
                <label>E-mail atual</label>
                <input
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                  className={styles.disabledInput}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="profile-new-email">Novo E-mail</label>
                <input
                  id="profile-new-email"
                  type="email"
                  placeholder="novo@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="email-current-password">Senha atual (para autorizar)</label>
                <PasswordInput
                  id="email-current-password"
                  value={emailCurrentPassword}
                  onChange={(e) => setEmailCurrentPassword(e.target.value)}
                  placeholder="Sua senha atual"
                />
              </div>

              <button
                type="submit"
                className={styles.saveBtn}
                disabled={emailStatus.loading}
              >
                {emailStatus.loading ? "Atualizando..." : "Atualizar E-mail"}
              </button>
            </form>
          </section>

          {/* CARD 3: SENHA */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🔐</span>
              <div>
                <h3>Alterar Senha</h3>
                <p>Mantenha sua conta sempre protegida</p>
              </div>
            </div>

            {passStatus.error && <div className={styles.errorBox}>{passStatus.error}</div>}
            {passStatus.success && <div className={styles.successBox}>{passStatus.success}</div>}

            <form onSubmit={handleUpdatePassword} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="pass-current">Senha atual</label>
                <PasswordInput
                  id="pass-current"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Sua senha atual"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="pass-new">Nova senha (mínimo 6 dígitos)</label>
                <PasswordInput
                  id="pass-new"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="pass-confirm">Confirmar nova senha</label>
                <PasswordInput
                  id="pass-confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                />
              </div>

              <button
                type="submit"
                className={styles.saveBtn}
                disabled={passStatus.loading}
              >
                {passStatus.loading ? "Atualizando..." : "Atualizar Senha"}
              </button>
            </form>
          </section>

        </div>
      </main>
    </div>
  );
}
