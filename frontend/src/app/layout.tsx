import type { Metadata } from "next";
import { Inter, Outfit, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s · DocPilot AI",
    default: "DocPilot AI — Intelligence Documentaire",
  },
  description:
    "Plateforme SaaS de Document Intelligence : réponses IA sourcées, traçables et sécurisées pour les équipes ambitieuses.",
  themeColor: "#08090f",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://docpilot.ai"
  ),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "DocPilot AI",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans">
        <a href="#main" className="skip-link">
          Aller au contenu principal
        </a>
        <AuthProvider>
          <div className="bg-mesh-dynamic" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
