"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/firebase/auth-context";
import { ensureUserAndHousehold } from "@/lib/firebase/household";
import { HouseholdProvider } from "@/lib/firebase/household-context";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    setBootstrapping(true);
    ensureUserAndHousehold(user)
      .then((id) => {
        if (!cancelled) {
          setHouseholdId(id);
          setBootstrapping(false);
        }
      })
      .catch((error) => {
        console.error("Failed to bootstrap household", error);
        if (!cancelled) setBootstrapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loading, user, router]);

  if (loading || bootstrapping || !user || !householdId) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        読み込み中…
      </main>
    );
  }

  return (
    <HouseholdProvider householdId={householdId}>
      <AppHeader />
      <main className="flex-1">{children}</main>
    </HouseholdProvider>
  );
}
