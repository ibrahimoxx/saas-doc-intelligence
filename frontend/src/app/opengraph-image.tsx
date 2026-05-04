import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DocPilot AI — Intelligence Documentaire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "72px 80px",
          background:
            "radial-gradient(ellipse at 0% 0%, #4338ca 0%, transparent 55%), radial-gradient(ellipse at 100% 0%, #7e22ce 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, #0891b2 0%, transparent 55%), #08090f",
          fontFamily: "sans-serif",
        }}
      >
        {/* Noise overlay approximation */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, transparent 50%, rgba(168,85,247,0.08) 100%)",
          }}
        />

        {/* Brand mark */}
        <div
          style={{
            position: "absolute",
            top: 72,
            left: 80,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              color: "#fff",
              fontWeight: 700,
            }}
          >
            D
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            DocPilot AI
          </span>
        </div>

        {/* Headline */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#fafafa",
              maxWidth: 900,
            }}
          >
            Intelligence Documentaire
          </p>
          <p
            style={{
              margin: "20px 0 0",
              fontSize: 24,
              color: "rgba(255,255,255,0.65)",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              maxWidth: 680,
            }}
          >
            Réponses IA sourcées, traçables et sécurisées pour les équipes
            ambitieuses.
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
