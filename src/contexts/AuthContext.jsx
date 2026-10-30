import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { isNicknameAvailable, claimNickname } from "../services/nicknameService";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(email, password, displayName, nickname) {
    const finalNickname = (nickname || displayName || "").trim();

    // 1. Consulta ao banco O(1) antes de permitir a criação da conta
    const check = await isNicknameAvailable(finalNickname);
    if (!check.available) {
      throw new Error(check.error || "Este apelido já está em uso.");
    }

    // 2. Cria a conta no Firebase Auth
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // 3. Atualiza o perfil no Firebase Auth
    await updateProfile(result.user, { displayName: finalNickname });

    // 4. Salva a unicidade no banco de dados com chave primária usernames/{normalized}
    await claimNickname(result.user.uid, finalNickname);

    return result.user;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  // Envia e-mail de redefinição de senha
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Atualiza apelido (displayName) com verificação de unicidade no banco
  async function updateUserNickname(newNickname) {
    if (!auth.currentUser) throw new Error("Usuário não autenticado.");
    const oldNickname = auth.currentUser.displayName || "";
    const trimmed = (newNickname || "").trim();

    // Reivindica atômico no Firestore (valida O(1) e troca de chave)
    await claimNickname(auth.currentUser.uid, trimmed, oldNickname);

    // Atualiza Auth displayName
    await updateProfile(auth.currentUser, { displayName: trimmed });
    setCurrentUser({ ...auth.currentUser, displayName: trimmed });
  }

  // Atualiza e-mail com reautenticação obrigatória por senha
  async function updateUserEmail(newEmail, currentPassword) {
    if (!auth.currentUser) throw new Error("Usuário não autenticado.");
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updateEmail(auth.currentUser, newEmail);
    setCurrentUser({ ...auth.currentUser });
  }

  // Atualiza senha com reautenticação obrigatória por senha atual
  async function updateUserPassword(newPassword, currentPassword) {
    if (!auth.currentUser) throw new Error("Usuário não autenticado.");
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
    setCurrentUser({ ...auth.currentUser });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    register,
    login,
    logout,
    resetPassword,
    updateUserNickname,
    updateUserEmail,
    updateUserPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
