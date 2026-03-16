import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "DocPilot AI — Document Intelligence",
  description:
    "Plateforme SaaS de Document Intelligence : réponses IA sourcées, traçables et sécurisées.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans">
        <AuthProvider>
          {/* Dynamic Mesh Atmosphere */}
          <div className="bg-mesh-dynamic" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
