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
  const [debug, setDebug] = useState<string[]>([]);

  const videoRefCallback = useCallback((el: HTMLVideoElement | null) => {
    setVideoEl(el);
  }, []);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!open) return;
    if (!stream) {
      setDebug((d) => [...d, "stream=null"]);
      return;
    }
    if (!videoEl) {
      setDebug((d) => [...d, "waiting for video mount"]);
      return;
    }

    let cancelled = false;
    setError(null);
    setDebug([]);

    const log = (msg: string) => {
      console.log("[scanner]", msg);
      setDebug((d) => [...d, msg]);
    };

    const tracks = stream.getVideoTracks();
    log(`stream tracks=${tracks.length}`);
    tracks.forEach((t, i) => {
      log(`track[${i}] state=${t.readyState} enabled=${t.enabled} muted=${t.muted} label=${t.label}`);
    });

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, SCAN_FORMATS);
    const reader = new BrowserMultiFormatReader(hints);

    videoEl.srcObject = stream;
    log("srcObject set");

    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          log(`play() resolved (paused=${videoEl.paused})`);
        })
        .catch((err) => {
          log(`play() rejected: ${err?.name ?? "?"}: ${err?.message ?? err}`);
        });
    } else {
      log("play() returned non-promise");
    }

    const onLoadedMetadata = () => {
      log(`loadedmetadata vw=${videoEl.videoWidth} vh=${videoEl.videoHeight}`);
    };
    const onPlaying = () => {
      log(`playing readyState=${videoEl.readyState}`);
    };
    const onStalled = () => log("stalled");
    const onSuspend = () => log("suspend");
    videoEl.addEventListener("loadedmetadata", onLoadedMetadata);
    videoEl.addEventListener("playing", onPlaying);
    videoEl.addEventListener("stalled", onStalled);
    videoEl.addEventListener("suspend", onSuspend);

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
      .then(() => log("decodeFromStream started"))
      .catch((err) => {
        log(`decodeFromStream failed: ${err?.message ?? err}`);
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
      videoEl.removeEventListener("loadedmetadata", onLoadedMetadata);
      videoEl.removeEventListener("playing", onPlaying);
      videoEl.removeEventListener("stalled", onStalled);
      videoEl.removeEventListener("suspend", onSuspend);
      controlsRef.current?.stop();
      controlsRef.current = null;
      if (videoEl) {
        videoEl.srcObject = null;
      }
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
          {debug.length > 0 && (
            <pre className="max-h-32 overflow-auto rounded bg-muted p-2 text-[10px] leading-tight whitespace-pre-wrap">
              {debug.join("\n")}
            </pre>
          )}
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
