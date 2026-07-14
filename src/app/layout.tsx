import type { Metadata } from "next";
import { Outfit, Public_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  title: "Ostomy World | Secure, Discreet, and Active Living",
  description: "Ostomy World provides premium medical appliances like the OstoBelt for secure, discreet, and active living for the ostomate community.",
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
            <Navbar />
            <main className="flex-1 pt-24">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
