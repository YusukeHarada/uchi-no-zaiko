"use client";

import { cn } from "@/lib/utils";

export interface ChipOption {
  value: string;
  label: string;
  /** 選択されていないときに追加で当てるクラス (カテゴリ色など) */
  className?: string;
}

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly ChipOption[];
  /** true にすると折り返さず横スクロールする */
  scroll?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * タップで1つ選ぶ丸チップ列。Select の代わりに使うことで、
 * 「開く → 選ぶ」の2アクションを1タップに縮める。
 */
export function ChipGroup({
  value,
  onValueChange,
  options,
  scroll = false,
  className,
  "aria-label": ariaLabel,
}: Props) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "flex gap-1.5",
        scroll
          ? "overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          : "flex-wrap",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              selected
                ? "bg-primary text-primary-foreground"
                : cn(
                    "border border-border bg-card text-muted-foreground hover:text-foreground",
                    option.className,
                  ),
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
