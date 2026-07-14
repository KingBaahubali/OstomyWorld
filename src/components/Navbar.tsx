"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Shop", href: "/shop" },
    { name: "Contact Us", href: "/contact" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-surface-card transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-md px-lg flex items-center justify-between">
        <Link href="/" className="flex items-center gap-sm">
          <Image
            src="/assets/Full logo green.png"
            alt="Ostomy World Logo"
            width={180}
            height={60}
            className="object-contain"
          />
        </Link>
        <div className="hidden md:flex items-center gap-lg font-outfit font-bold text-text-main">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="relative group px-2 py-1">
              <span className="relative z-10 group-hover:text-primary transition-colors">
                {link.name}
              </span>
              {pathname === link.href && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute inset-0 border-b-2 border-primary"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
            </Link>
          ))}
        </div>
        <Link href="/shop" className="bg-primary text-background px-lg py-sm rounded-md font-outfit font-bold hover:scale-[1.02] hover:shadow-md transition-all active:scale-[0.98]">
          Shop Now
        </Link>
      </div>
    </nav>
  );
}
