"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { totalItems } = useCart();
  
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
        
        <div className="flex items-center gap-4">
          {!loading && (
            user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 font-outfit font-bold text-text-main hover:text-primary transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-text-muted/20 rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all overflow-hidden flex flex-col">
                  <span className="px-4 py-3 border-b border-text-muted/10 font-outfit font-bold text-sm truncate">
                    {user.email}
                  </span>
                  <Link href="/account" className="px-4 py-3 text-left font-public text-sm hover:bg-surface-card transition-colors text-text-main border-b border-text-muted/10">
                    My Account
                  </Link>
                  <button onClick={logout} className="px-4 py-3 text-left font-public text-sm hover:bg-surface-card transition-colors text-red-500">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="font-outfit font-bold text-text-main hover:text-primary transition-colors px-2">
                Sign In
              </Link>
            )
          )}
          
          <Link href="/cart" className="relative p-2 text-text-main hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1"/>
              <circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-background bg-red-500 rounded-full">
                {totalItems}
              </span>
            )}
          </Link>

          <Link href="/shop" className="bg-primary text-background px-lg py-sm rounded-md font-outfit font-bold hover:scale-[1.02] hover:shadow-md transition-all active:scale-[0.98] ml-2">
            Shop Now
          </Link>
        </div>
      </div>
    </nav>
  );
}
