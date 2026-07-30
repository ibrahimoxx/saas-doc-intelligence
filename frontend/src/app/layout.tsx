import type { Metadata, Viewport } from "next";
import {
  Inter,
  Instrument_Serif,
  JetBrains_Mono,
  Outfit,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { Toast } from "@/components/ui/Toast";
import {
  StructuredData,
  organizationSchema,
} from "@/components/seo/StructuredData";

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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0f" },
  ],
};

export const metadata: Metadata = {
  title: {
    template: "%s · DocPilot AI",
    default: "DocPilot AI — Intelligence Documentaire",
  },
  description:
    "Plateforme SaaS de Document Intelligence : réponses IA sourcées, traçables et sécurisées pour les équipes ambitieuses.",
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
        <StructuredData data={organizationSchema} />
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toast />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
