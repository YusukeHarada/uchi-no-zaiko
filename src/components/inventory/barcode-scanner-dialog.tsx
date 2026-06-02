"use client";

import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { useCallback, useEffect, useRef, useState } from "react";
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
  stream: MediaStream | null;
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

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
  stream,
}: Props) {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  // Base UI の Dialog は children を遅延マウントするため、useRef では
  // 要素を検知できない。callback ref + state で確実に待ち受ける。
  const videoRefCallback = useCallback((el: HTMLVideoElement | null) => {
    setVideoEl(el);
  }, []);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!open || !stream || !videoEl) return;

    let cancelled = false;
    setError(null);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, SCAN_FORMATS);
    const reader = new BrowserMultiFormatReader(hints);

    videoEl.srcObject = stream;
    videoEl.play().catch((err) => {
      console.error("video.play() failed", err);
    });

    reader
      .decodeFromStream(stream, videoEl, (result, _err, controls) => {
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
      })
      .catch((err) => {
        console.error("Scanner start failed", err);
        if (!cancelled) {
          setError(
            err instanceof Error
              ? `スキャナー起動失敗: ${err.message}`
              : "スキャナー起動失敗",
          );
        }
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      videoEl.srcObject = null;
    };
  }, [open, stream, videoEl]);

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
              ref={videoRefCallback}
              className="size-full object-cover"
              playsInline
              muted
              autoPlay
            />
          </div>
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
