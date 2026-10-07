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

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function register(email, password, displayName) {
    return createUserWithEmailAndPassword(auth, email, password).then(
      (result) => {
        return updateProfile(result.user, { displayName });
      }
    );
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

  // Atualiza apelido (displayName)
  async function updateUserNickname(displayName) {
    if (!auth.currentUser) throw new Error("Usuário não autenticado.");
    await updateProfile(auth.currentUser, { displayName });
    setCurrentUser({ ...auth.currentUser });
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
