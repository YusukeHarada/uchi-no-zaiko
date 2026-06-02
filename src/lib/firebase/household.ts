import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDb } from "./config";
import { fsPath } from "./paths";

export async function ensureUserAndHousehold(user: User): Promise<string> {
  const db = getDb();
  const userRef = doc(db, fsPath.user(user.uid));
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data();
    if (data.defaultHouseholdId) {
      return data.defaultHouseholdId as string;
    }
  }

  const householdId = user.uid;
  const householdRef = doc(db, fsPath.household(householdId));
  const batch = writeBatch(db);

  batch.set(
    householdRef,
    {
      name: `${user.displayName ?? "わたし"}の在庫`,
      ownerUid: user.uid,
      memberUids: [user.uid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  batch.set(
    userRef,
    {
      uid: user.uid,
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      defaultHouseholdId: householdId,
      createdAt: snapshot.exists() ? snapshot.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();
  return householdId;
}

export async function fetchDefaultHouseholdId(uid: string): Promise<string | null> {
  const db = getDb();
  const snapshot = await getDoc(doc(db, fsPath.user(uid)));
  if (!snapshot.exists()) return null;
  return (snapshot.data().defaultHouseholdId as string | null) ?? null;
}

export async function setUserDoc(user: User): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, fsPath.user(user.uid)),
    {
      uid: user.uid,
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
