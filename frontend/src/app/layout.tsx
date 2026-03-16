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
          {/* Global Background Atmosphere */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="bg-blob top-[-10%] left-[-10%] bg-purple-600/15" />
            <div className="bg-blob bottom-[-10%] right-[-10%] bg-indigo-600/15" />
          </div>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
