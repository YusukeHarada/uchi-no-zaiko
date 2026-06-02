"use client";

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type Html5QrcodeCameraScanConfig,
} from "html5-qrcode";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

const SCAN_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
];

const SCAN_CONFIG: Html5QrcodeCameraScanConfig = {
  fps: 10,
  qrbox: { width: 260, height: 160 },
  aspectRatio: 1.5,
};

export function BarcodeScannerDialog({ open, onOpenChange, onScan }: Props) {
  const elementId = useId().replace(/[:]/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError(null);
    setStarting(true);

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(elementId, {
          formatsToSupport: SCAN_FORMATS,
          verbose: false,
        });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          SCAN_CONFIG,
          (decodedText) => {
            if (cancelled) return;
            onScan(decodedText);
          },
          undefined,
        );
        if (cancelled) {
          await scanner.stop().catch(() => undefined);
          scanner.clear();
          scannerRef.current = null;
        } else {
          setStarting(false);
        }
      } catch (err) {
        console.error("Camera start failed", err);
        if (!cancelled) {
          setError(
            "カメラを起動できませんでした。ブラウザのカメラ権限を確認してください。",
          );
          setStarting(false);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner
          .stop()
          .catch(() => undefined)
          .finally(() => {
            try {
              scanner.clear();
            } catch {
              /* noop */
            }
          });
      }
    };
  }, [open, onScan, elementId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>バーコードをスキャン</DialogTitle>
          <DialogDescription>
            商品のバーコードを枠内に映してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {error ? (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div
            id={elementId}
            className="aspect-[3/2] w-full overflow-hidden rounded-lg bg-black [&_video]:size-full [&_video]:object-cover"
          />
          {starting && !error ? (
            <p className="text-center text-xs text-muted-foreground">
              カメラを起動中…
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
