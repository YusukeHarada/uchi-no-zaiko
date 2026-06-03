"use client";

import { Check, Copy, RefreshCw, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  generateInviteCode,
  getHouseholdInfo,
  getItemCount,
  joinHousehold,
  lookupInviteCode,
  migrateItems,
  type HouseholdInfo,
  type InviteLookupResult,
} from "@/lib/firebase/invite";

interface Props {
  householdId: string;
}

export function HouseholdSettingsView({ householdId }: Props) {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [info, setInfo] = useState<HouseholdInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // 招待コード発行
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // 参加フロー — URL パラメータから自動セット可能
  const [joinHid, setJoinHid] = useState(searchParams?.get("h") ?? "");
  const [joinCode, setJoinCode] = useState(searchParams?.get("c") ?? "");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<InviteLookupResult | null>(null);
  const [existingItemCount, setExistingItemCount] = useState(0);
  const [migrateChoice, setMigrateChoice] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    setLoadingInfo(true);
    getHouseholdInfo(householdId)
      .then(setInfo)
      .catch(console.error)
      .finally(() => setLoadingInfo(false));
  }, [householdId]);

  // URL パラメータがあれば自動で確認実行
  useEffect(() => {
    const h = searchParams?.get("h");
    const c = searchParams?.get("c");
    if (h && c && user) {
      setJoinHid(h);
      setJoinCode(c);
      handleLookupWith(h, c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleGenerateCode = async () => {
    if (!user) return;
    setGeneratingCode(true);
    try {
      const code = await generateInviteCode(householdId);
      const updated = await getHouseholdInfo(householdId);
      setInfo(updated);
      toast.success("招待コードを発行しました");
    } catch (err) {
      console.error(err);
      toast.error("コードの発行に失敗しました");
    } finally {
      setGeneratingCode(false);
    }
  };

  const getInviteUrl = () => {
    if (typeof window === "undefined" || !info?.inviteCode) return "";
    return `${window.location.origin}/settings/household?h=${householdId}&c=${info.inviteCode}`;
  };

  const handleCopyLink = async () => {
    const url = getInviteUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLookupWith = async (hid: string, code: string) => {
    if (!user || !hid.trim() || !code.trim()) return;
    setLookingUp(true);
    setLookupResult(null);
    try {
      const result = await lookupInviteCode(hid.trim(), code.trim().toUpperCase(), user.uid);
      setLookupResult(result);
      if (result.found && !result.alreadyMember) {
        const count = await getItemCount(householdId);
        setExistingItemCount(count);
        setMigrateChoice(count > 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("コードの確認に失敗しました");
    } finally {
      setLookingUp(false);
    }
  };

  const handleLookup = () => handleLookupWith(joinHid, joinCode);

  const handleJoin = async () => {
    if (!user || !lookupResult?.found || lookupResult.alreadyMember) return;
    setJoining(true);
    try {
      await joinHousehold(user.uid, user.displayName, lookupResult.householdId);
      if (migrateChoice && existingItemCount > 0) {
        const migrated = await migrateItems(householdId, lookupResult.householdId);
        toast.success(`グループに参加しました。在庫 ${migrated} 件を移行しました。`);
      } else {
        toast.success("グループに参加しました");
      }
      window.location.href = "/inventory";
    } catch (err) {
      console.error(err);
      toast.error("参加に失敗しました");
      setJoining(false);
    }
  };

  const isOwner = !!user && info?.ownerUid === user.uid;
  const memberCount = info?.memberUids.length ?? 1;
  const expiresLabel = info?.inviteCodeExpiresAt
    ? `${info.inviteCodeExpiresAt.toDate().toLocaleString("ja-JP", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })} まで有効`
    : null;

  return (
    <div className="mx-auto w-full max-w-xl space-y-8 p-4 sm:p-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          家族と共有
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          招待リンクを共有して、家族と在庫を一緒に管理できます。
        </p>
      </div>

      {/* 現在のグループ */}
      <section className="card rounded-xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {loadingInfo ? "読み込み中…" : (info?.name ?? "グループ")}
            </p>
            <p className="text-xs text-muted-foreground">
              メンバー {memberCount} 人{memberCount > 1 ? " · 共有中" : ""}
            </p>
          </div>
        </div>
        {info && Object.keys(info.memberNames).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {info.memberUids.map((uid) => (
              <span
                key={uid}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {info.memberNames[uid] ?? uid.slice(0, 8)}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 招待リンクを発行（オーナーのみ） */}
      {isOwner && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">家族を招待する</h2>
          <p className="text-sm text-muted-foreground">
            招待リンクを発行して LINE などで家族に送ってください。24時間有効です。
          </p>

          {info?.inviteCode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border bg-muted px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em]">
                  {info.inviteCode}
                </div>
                <Button
                  className="h-14 shrink-0 gap-1.5 px-4"
                  onClick={handleCopyLink}
                  variant={copied ? "secondary" : "default"}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "コピー済み" : "リンクをコピー"}
                </Button>
              </div>
              {expiresLabel && (
                <p className="text-center text-xs text-muted-foreground">{expiresLabel}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10"
                onClick={handleGenerateCode}
                disabled={generatingCode}
              >
                <RefreshCw className={generatingCode ? "animate-spin" : ""} />
                {generatingCode ? "発行中…" : "新しいコードを発行"}
              </Button>
            </div>
          ) : (
            <Button className="w-full h-11" onClick={handleGenerateCode} disabled={generatingCode}>
              {generatingCode ? "発行中…" : "招待リンクを発行"}
            </Button>
          )}
        </section>
      )}

      {/* 招待リンクで参加する */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">コードでグループに参加する</h2>
        <p className="text-sm text-muted-foreground">
          家族から受け取ったリンクをタップするか、コードを手入力してください。
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="join-hid" className="text-xs text-muted-foreground">
              グループID（リンクから自動入力）
            </Label>
            <Input
              id="join-hid"
              value={joinHid}
              onChange={(e) => { setJoinHid(e.target.value); setLookupResult(null); }}
              placeholder="相手のグループID"
              className="h-11 font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="join-code" className="text-xs text-muted-foreground">
              招待コード（6文字）
            </Label>
            <div className="flex gap-2">
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setLookupResult(null); }}
                placeholder="ABC123"
                maxLength={6}
                className="h-11 font-mono text-base tracking-widest uppercase"
              />
              <Button
                className="h-11 shrink-0"
                onClick={handleLookup}
                disabled={lookingUp || !joinHid.trim() || joinCode.trim().length !== 6}
              >
                {lookingUp ? "確認中…" : "確認"}
              </Button>
            </div>
          </div>
        </div>

        {/* 検索結果 */}
        {lookupResult && !lookupResult.found && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {lookupResult.reason === "expired"
              ? "コードの有効期限が切れています。新しいコードを発行してもらってください。"
              : "コードが見つかりませんでした。入力内容を確認してください。"}
          </p>
        )}

        {lookupResult?.found && lookupResult.alreadyMember && (
          <p className="rounded-lg border border-primary/30 bg-primary/8 px-4 py-3 text-sm text-primary">
            「{lookupResult.householdName}」にはすでに参加しています。
          </p>
        )}

        {lookupResult?.found && !lookupResult.alreadyMember && (
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold">「{lookupResult.householdName}」に参加します</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                参加後は、このグループの在庫・買い物リストが共有されます。
              </p>
            </div>
            {existingItemCount > 0 && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={migrateChoice}
                  onChange={(e) => setMigrateChoice(e.target.checked)}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span className="text-sm">
                  現在の在庫（{existingItemCount}件）を新しいグループに移行する
                </span>
              </label>
            )}
            <Button className="w-full h-11" onClick={handleJoin} disabled={joining}>
              {joining ? "参加中…" : "グループに参加する"}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
