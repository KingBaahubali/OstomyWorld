"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    // Admin gets a completely bare shell — no navbar, no footer, no pt-24
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24">{children}</main>
      <Footer />
    </>
  );
}
