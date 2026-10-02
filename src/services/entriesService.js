import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION = "entries";

// Criar nova entrada (filme ou série)
export async function createEntry(userId, data) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Listar entradas do usuário logado
export async function getUserEntries(userId) {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Atualizar entrada existente
export async function updateEntry(entryId, data) {
  const ref = doc(db, COLLECTION, entryId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

// Excluir entrada
export async function deleteEntry(entryId) {
  await deleteDoc(doc(db, COLLECTION, entryId));
}
