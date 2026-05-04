import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #14b8a6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 96,
          fontWeight: 700,
          color: "#fff",
          fontFamily: "sans-serif",
          letterSpacing: "-0.04em",
        }}
      >
        D
      </div>
    ),
    { ...size }
  );
}
