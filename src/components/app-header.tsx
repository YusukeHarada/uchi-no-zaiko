"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/auth-context";
import { signOut } from "@/lib/firebase/auth";

const NAV_LINKS = [
  { href: "/inventory", label: "在庫" },
  { href: "/shopping", label: "買い物リスト" },
] as const;

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("ログアウトしました");
      router.replace("/login");
    } catch (error) {
      console.error(error);
      toast.error("ログアウトに失敗しました");
    }
  };

  const initial =
    user?.displayName?.trim()?.[0] ?? user?.email?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/inventory" className="font-semibold tracking-tight">
            うちの在庫
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {NAV_LINKS.map((link) => {
              const active = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            title="ログアウト"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            <span className="sr-only">ログアウト</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-9 rounded-full" />
              }
            >
              <Avatar className="size-9">
                {user?.photoURL ? (
                  <AvatarImage src={user.photoURL} alt={user.displayName ?? ""} />
                ) : null}
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col">
                  <span>{user?.displayName ?? "ユーザー"}</span>
                  {user?.email ? (
                    <span className="text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  ) : null}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push("/settings/categories")}
                >
                  カテゴリ管理
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
