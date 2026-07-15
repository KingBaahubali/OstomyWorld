import type { Metadata } from "next";
import { Outfit, Public_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ostomyworld.in'),
  title: {
    default: "Ostomy World | Premium Ostomy & Colostomy Support Belts",
    template: "%s | Ostomy World",
  },
  description: "India's first premium medical-grade ostomy support belts. Designed for security, discretion, and an active lifestyle. Free shipping across India.",
  keywords: ["ostomy belt", "colostomy support belt", "ileostomy belt india", "ostomy pouch cover", "stoma support", "ostomy active wear", "ostomy bag cover"],
  authors: [{ name: "Ostomy World" }],
  creator: "Ostomy World",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://ostomyworld.in",
    title: "Ostomy World | Premium Ostomy & Colostomy Support Belts",
    description: "India's first premium medical-grade ostomy support belts. Designed for security, discretion, and an active lifestyle.",
    siteName: "Ostomy World",
    images: [
      {
        url: "/assets/hero_family_v2.jpg",
        width: 1200,
        height: 630,
        alt: "Ostomy World Family",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ostomy World | Premium Ostomy & Colostomy Support Belts",
    description: "India's first premium medical-grade ostomy support belts. Designed for security, discretion, and an active lifestyle.",
    images: ["/assets/hero_family_v2.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${publicSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text-main">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
