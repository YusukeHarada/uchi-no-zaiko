import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #16a34a 0%, #0f7235 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "rgba(255,255,255,0.15)",
            marginBottom: 10,
            fontSize: 52,
            color: "white",
          }}
        >
          🥦
        </div>
        <div
          style={{
            color: "white",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "-0.5px",
          }}
        >
          うちの在庫
        </div>
      </div>
    ),
    size,
  );
}
