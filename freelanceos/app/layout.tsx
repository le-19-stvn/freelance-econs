import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

const siteUrl = "https://econs-freelance.com";
const siteName = "Freelance by eCons";
const description =
  "Centralisez votre activite freelance : factures, projets, clients et equipe en un seul endroit. L'outil tout-en-un pour les independants.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Freelance — Gestion tout-en-un pour independants | eCons",
    template: "%s | Freelance by eCons",
  },
  description,
  keywords: [
    "freelance",
    "facturation",
    "gestion freelance",
    "facture auto-entrepreneur",
    "devis freelance",
    "suivi projets",
    "eCons",
    "outil independant",
    "SaaS freelance",
    "gestion clients",
  ],
  authors: [{ name: "eCons" }],
  creator: "eCons",
  publisher: "eCons",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName,
    title: "Freelance — Gestion tout-en-un pour independants",
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Freelance by eCons — Gestion freelance tout-en-un",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Freelance — Gestion tout-en-un pour independants",
    description,
    images: ["/og-image.png"],
    creator: "@eCons",
  },
  // icons auto-generated from app/icon.png + app/apple-icon.png (Next.js file convention)
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
