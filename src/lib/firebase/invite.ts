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

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
const TTL_MS = 24 * 60 * 60 * 1000;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

/**
 * 招待コードを発行して household に保存する。
 * inviteCodes コレクションは使わず、household ドキュメントのみ更新。
 */
export async function generateInviteCode(householdId: string): Promise<string> {
  const db = getDb();
  const code = generateCode();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + TTL_MS));

  await writeBatch(db)
    .update(doc(db, fsPath.household(householdId)), {
      inviteCode: code,
      inviteCodeExpiresAt: expiresAt,
      updatedAt: serverTimestamp(),
    })
    .commit();

  return code;
}

/**
 * 招待コードを検証して世帯情報を返す。
 * householdId は招待リンクの URL パラメータから取得する。
 * ※ 非メンバーが読めるよう Firestore ルールの更新が必要
 */
export type InviteLookupResult =
  | { found: true; householdId: string; householdName: string; alreadyMember: boolean }
  | { found: false; reason: "not_found" | "expired" | "invalid_format" };

export async function lookupInviteCode(
  householdId: string,
  code: string,
  currentUid: string,
): Promise<InviteLookupResult> {
  const db = getDb();

  const snap = await getDoc(doc(db, fsPath.household(householdId)));
  if (!snap.exists()) return { found: false, reason: "not_found" };

  const data = snap.data();
  if (data.inviteCode !== code.trim().toUpperCase()) {
    return { found: false, reason: "not_found" };
  }
  const expiresAt = data.inviteCodeExpiresAt as Timestamp | null | undefined;
  if (!expiresAt || expiresAt.toDate() < new Date()) {
    return { found: false, reason: "expired" };
  }

  return {
    found: true,
    householdId,
    householdName: data.name as string,
    alreadyMember: (data.memberUids as string[]).includes(currentUid),
  };
}

/** 世帯に参加する */
export async function joinHousehold(
  uid: string,
  displayName: string | null,
  targetHouseholdId: string,
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

  await batch.commit();
}

/** 旧世帯のアイテムを新世帯にコピー（参加後に呼ぶ） */
export async function migrateItems(fromHid: string, toHid: string): Promise<number> {
  const db = getDb();
  const snapshot = await getDocs(collection(db, fsPath.items(fromHid)));
  if (snapshot.empty) return 0;

  const batch = writeBatch(db);
  for (const itemDoc of snapshot.docs) {
    batch.set(doc(collection(db, fsPath.items(toHid))), {
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
  const snap = await getDocs(collection(getDb(), fsPath.items(householdId)));
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

export async function getHouseholdInfo(householdId: string): Promise<HouseholdInfo | null> {
  const snap = await getDoc(doc(getDb(), fsPath.household(householdId)));
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
