"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (next: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  label?: string;
}

/**
 * [-] 値 単位 [+] のステッパー。
 * 数字部分をタップすると直接入力に切り替わるので、「10個まとめて」も打てる。
 */
export function QuantityStepper({
  value,
  onChange,
  unit,
  min = 0,
  max = 9999,
  step = 1,
  size = "md",
  disabled = false,
  className,
  label = "数量",
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const commitDraft = () => {
    const parsed = Number(draft);
    if (!Number.isNaN(parsed)) onChange(clamp(parsed));
    setEditing(false);
  };

  const buttonSize = size === "sm" ? "size-9" : "size-11";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";
  const valueWidth = size === "sm" ? "min-w-12" : "min-w-16";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card",
        disabled && "opacity-50",
        className,
      )}
    >
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - step))}
        aria-label={`${label}を減らす`}
        className={cn(
          buttonSize,
          "flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground",
        )}
      >
        <Minus className={iconSize} />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step="any"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            } else if (e.key === "Escape") {
              setEditing(false);
            }
          }}
          aria-label={label}
          className={cn(
            valueWidth,
            "bg-transparent text-center text-sm font-semibold tabular-nums outline-none",
          )}
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setDraft(String(value));
            setEditing(true);
          }}
          aria-label={`${label}を直接入力`}
          className={cn(
            valueWidth,
            "text-center text-sm font-semibold tabular-nums text-foreground",
          )}
        >
          {value}
          {unit ? (
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </button>
      )}

      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + step))}
        aria-label={`${label}を増やす`}
        className={cn(
          buttonSize,
          "flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground",
        )}
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
}
