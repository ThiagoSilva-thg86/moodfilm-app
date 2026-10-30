import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createEntry,
  getUserEntries,
  updateEntry,
  deleteEntry,
} from "../entriesService";

vi.mock("../../firebase/config", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => "mock-timestamp"),
}));

import { addDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";

describe("entriesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve criar uma nova entrada com timestamps e retornar o ID", async () => {
    addDoc.mockResolvedValueOnce({ id: "entry-abc-123" });

    const entryData = {
      title: "Interestelar",
      type: "Filme",
      rating: 9.5,
      status: "Assistido",
    };

    const id = await createEntry("user_456", entryData);

    expect(id).toBe("entry-abc-123");
    expect(addDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        title: "Interestelar",
        userId: "user_456",
        rating: 9.5,
        status: "Assistido",
      })
    );
  });

  it("deve buscar e mapear as entradas do usuário logado", async () => {
    getDocs.mockResolvedValueOnce({
      docs: [
        { id: "1", data: () => ({ title: "Batman", rating: 9 }) },
        { id: "2", data: () => ({ title: "Succession", rating: 10 }) },
      ],
    });

    const entries = await getUserEntries("user_456");

    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ id: "1", title: "Batman", rating: 9 });
    expect(entries[1]).toEqual({ id: "2", title: "Succession", rating: 10 });
  });

  it("deve chamar updateDoc com os dados atualizados", async () => {
    updateDoc.mockResolvedValueOnce();

    await updateEntry("entry-abc-123", { rating: 10 });

    expect(updateDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ rating: 10, updatedAt: "mock-timestamp" })
    );
  });

  it("deve chamar deleteDoc com a referência correta", async () => {
    deleteDoc.mockResolvedValueOnce();

    await deleteEntry("entry-abc-123");

    expect(deleteDoc).toHaveBeenCalledWith(undefined);
  });
});
