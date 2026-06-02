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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!open || !stream) return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    let cancelled = false;
    setError(null);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, SCAN_FORMATS);
    const reader = new BrowserMultiFormatReader(hints);

    // 取得済みストリームを video に attach (iOS Safari でも確実に表示するため明示的に play)
    videoEl.srcObject = stream;
    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        console.error("video.play() failed", err);
      });
    }

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
              ? `スキャナーの起動に失敗しました: ${err.message}`
              : "スキャナーの起動に失敗しました",
          );
        }
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [open, stream]);

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
