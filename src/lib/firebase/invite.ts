import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { getDb } from "./config";
import { fsPath } from "./paths";

// 紛らわしい文字(0,O,I,1)を除いた6文字コード
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TTL_MS = 24 * 60 * 60 * 1000;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

/** 招待コードを発行してコードを返す */
export async function generateInviteCode(
  householdId: string,
  displayName: string,
): Promise<string> {
  const db = getDb();
  const code = generateCode();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + TTL_MS));

  const householdRef = doc(db, fsPath.household(householdId));
  const householdSnap = await getDoc(householdRef);
  const householdName = householdSnap.exists()
    ? (householdSnap.data().name as string)
    : `${displayName}の在庫`;

  const batch = writeBatch(db);
  batch.set(doc(db, "inviteCodes", code), {
    householdId,
    householdName,
    expiresAt,
  });
  batch.update(householdRef, {
    inviteCode: code,
    inviteCodeExpiresAt: expiresAt,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return code;
}

export type InviteLookupResult =
  | {
      found: true;
      householdId: string;
      householdName: string;
      alreadyMember: boolean;
    }
  | {
      found: false;
      reason: "not_found" | "expired";
    };

/** コードを検索して世帯情報を返す（参加前の確認用） */
export async function lookupInviteCode(
  code: string,
  currentUid: string,
): Promise<InviteLookupResult> {
  const db = getDb();
  const normalized = code.trim().toUpperCase();

  const snap = await getDoc(doc(db, "inviteCodes", normalized));
  if (!snap.exists()) return { found: false, reason: "not_found" };

  const data = snap.data();
  if ((data.expiresAt as Timestamp).toDate() < new Date()) {
    return { found: false, reason: "expired" };
  }

  const householdSnap = await getDoc(doc(db, fsPath.household(data.householdId)));
  const memberUids: string[] = householdSnap.exists()
    ? (householdSnap.data().memberUids as string[])
    : [];

  return {
    found: true,
    householdId: data.householdId as string,
    householdName: data.householdName as string,
    alreadyMember: memberUids.includes(currentUid),
  };
}

/** 世帯に参加する（memberUids追加 + defaultHouseholdId更新） */
export async function joinHousehold(
  uid: string,
  displayName: string | null,
  targetHouseholdId: string,
  inviteCode: string,
): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);

  batch.update(doc(db, fsPath.household(targetHouseholdId)), {
    memberUids: arrayUnion(uid),
    [`memberNames.${uid}`]: displayName ?? uid,
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, fsPath.user(uid)), {
    defaultHouseholdId: targetHouseholdId,
    updatedAt: serverTimestamp(),
  });

  // 使用済みコードを削除
  batch.delete(doc(db, "inviteCodes", inviteCode.trim().toUpperCase()));

  await batch.commit();
}

/** 旧世帯からアイテムを新世帯にコピー（参加後に呼ぶ） */
export async function migrateItems(
  fromHid: string,
  toHid: string,
): Promise<number> {
  const db = getDb();
  const snapshot = await getDocs(collection(db, fsPath.items(fromHid)));
  if (snapshot.empty) return 0;

  const batch = writeBatch(db);
  for (const itemDoc of snapshot.docs) {
    const newRef = doc(collection(db, fsPath.items(toHid)));
    batch.set(newRef, {
      ...itemDoc.data(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return snapshot.size;
}

/** 世帯のアイテム件数を取得 */
export async function getItemCount(householdId: string): Promise<number> {
  const db = getDb();
  const snap = await getDocs(collection(db, fsPath.items(householdId)));
  return snap.size;
}

export interface HouseholdInfo {
  name: string;
  ownerUid: string;
  memberUids: string[];
  memberNames: Record<string, string>;
  inviteCode: string | null;
  inviteCodeExpiresAt: Timestamp | null;
}

/** 世帯情報を取得 */
export async function getHouseholdInfo(
  householdId: string,
): Promise<HouseholdInfo | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, fsPath.household(householdId)));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    name: d.name as string,
    ownerUid: d.ownerUid as string,
    memberUids: (d.memberUids as string[]) ?? [],
    memberNames: (d.memberNames as Record<string, string>) ?? {},
    inviteCode: (d.inviteCode as string | null) ?? null,
    inviteCodeExpiresAt: (d.inviteCodeExpiresAt as Timestamp | null) ?? null,
  };
}
