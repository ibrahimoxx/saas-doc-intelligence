interface StructuredDataProps {
  data: Record<string, unknown>;
}

// Safe: JSON.stringify encodes all HTML special chars (<, >, &, ", ').
// Data is always a static compile-time schema — never user input.
// This is the documented Next.js pattern for JSON-LD injection.
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e")
          .replace(/&/g, "\\u0026"),
      }}
    />
  );
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DocPilot AI",
  applicationCategory: "BusinessApplication",
  description:
    "Plateforme SaaS de Document Intelligence : réponses IA sourcées, traçables et sécurisées pour les équipes ambitieuses.",
  offers: {
    "@type": "Offer",
    availability: "https://schema.org/OnlineOnly",
  },
  operatingSystem: "Web",
  inLanguage: "fr",
};
