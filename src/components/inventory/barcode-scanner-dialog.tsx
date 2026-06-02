"use client";

import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { useEffect, useRef, useState } from "react";
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
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
];

export function BarcodeScannerDialog({ open, onOpenChange, onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!open) return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    let cancelled = false;
    setError(null);
    setStarting(true);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, SCAN_FORMATS);
    const reader = new BrowserMultiFormatReader(hints);

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        videoEl,
        (result, _err, controls) => {
          if (cancelled) {
            controls.stop();
            return;
          }
          if (result) {
            controlsRef.current = controls;
            controls.stop();
            onScanRef.current(result.getText());
          } else {
            controlsRef.current = controls;
          }
        },
      )
      .then((controls) => {
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStarting(false);
      })
      .catch((err) => {
        console.error("Scanner start failed", err);
        if (cancelled) return;
        const message =
          err instanceof Error && err.name === "NotAllowedError"
            ? "カメラへのアクセスが拒否されました。ブラウザの設定で許可してください。"
            : "カメラを起動できませんでした。";
        setError(message);
        setStarting(false);
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>バーコードをスキャン</DialogTitle>
          <DialogDescription>
            商品のバーコードをカメラに映してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {error ? (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="aspect-[3/2] w-full overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              className="size-full object-cover"
              playsInline
              muted
              autoPlay
            />
          </div>
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
