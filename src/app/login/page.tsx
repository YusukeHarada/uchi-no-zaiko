"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/auth-context";
import { signInWithGoogle } from "@/lib/firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/inventory");
    }
  }, [loading, user, router]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      toast.success("ログインしました");
    } catch (error) {
      console.error(error);
      toast.error("ログインに失敗しました");
      setSigningIn(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <h1
            className="text-4xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            うちの在庫
          </h1>
          <div className="mt-3 flex items-center justify-center gap-3 text-primary/35">
            <div className="h-px w-14 bg-current" />
            <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor" className="rotate-45 opacity-60">
              <rect width="6" height="6" />
            </svg>
            <div className="h-px w-14 bg-current" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            家庭の食品在庫をシンプルに管理
          </p>
        </div>

        {/* Login Card */}
        <div className="card rounded-2xl border bg-card p-6">
          <p className="mb-5 text-center text-sm text-muted-foreground">
            Google アカウントでログイン
          </p>
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleSignIn}
            disabled={signingIn || loading || !!user}
          >
            {signingIn ? "ログイン中…" : "Google でログイン"}
          </Button>
        </div>
      </div>
    </main>
  );
}
