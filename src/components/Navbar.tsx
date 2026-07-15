"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { totalItems } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Shop", href: "/shop" },
    { name: "Contact Us", href: "/contact" },
  ];

  return (
    <>
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-surface-card transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-md px-4 sm:px-lg flex items-center justify-between md:justify-between h-[80px]">
        {/* Mobile Hamburger Icon (Left) */}
        <button 
          className="md:hidden p-2 -ml-2 text-text-main flex-shrink-0"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>

        {/* Logo (Centered on mobile, Left on Desktop) */}
        <Link href="/" className="flex items-center gap-sm absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          <Image
            src="/assets/Full logo green.png"
            alt="Ostomy World Logo"
            width={180}
            height={60}
            className="object-contain"
          />
        </Link>
        
        {/* Desktop Links */}
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
        
        {/* Right side items (Responsive) */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-4">
          {!loading && (
            user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 font-outfit font-bold text-text-main hover:text-primary transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-text-muted/20 rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all overflow-hidden flex flex-col">
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
          </div>
          
          <Link href="/cart" className="relative p-2 text-text-main hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1"/>
              <circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                {totalItems}
              </span>
            )}
          </Link>

          <Link href="/shop" className="hidden md:flex bg-primary text-white px-lg py-sm rounded-md font-outfit font-bold hover:scale-[1.02] hover:shadow-md transition-all active:scale-[0.98] ml-2 flex-shrink-0 items-center justify-center">
            Shop Now
          </Link>
        </div>
      </div>
    </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-text-main/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] bg-[#FFFFFF] z-50 border-r border-text-muted/10 shadow-2xl flex flex-col md:hidden"
            >
              <div className="p-4 border-b border-text-muted/10 flex justify-between items-center">
                <Image src="/assets/Full logo green.png" alt="Logo" width={140} height={40} className="object-contain" />
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-text-muted hover:text-text-main">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2 font-outfit font-bold text-lg">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg hover:bg-surface-card transition-colors">
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="p-4 border-t border-text-muted/10 flex flex-col gap-4">
                <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-3 rounded-lg bg-surface-card hover:bg-text-muted/5 transition-colors">
                  <span className="font-outfit font-bold">Your Cart</span>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                    <span className="bg-primary text-white px-2 py-0.5 rounded-full text-xs font-bold">{totalItems}</span>
                  </div>
                </Link>

                {!loading && (
                  user ? (
                    <div className="flex flex-col gap-2">
                      <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="font-outfit font-bold p-3 rounded-lg hover:bg-surface-card transition-colors">My Account</Link>
                      <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-left font-outfit font-bold p-3 rounded-lg hover:bg-red-50 text-red-500 transition-colors">Sign Out</button>
                    </div>
                  ) : (
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block text-center font-outfit font-bold py-3 bg-surface-card rounded-lg text-text-main transition-colors">
                      Sign In
                    </Link>
                  )
                )}

                <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block text-center bg-primary text-white py-3 rounded-lg font-outfit font-bold shadow-md">
                  Shop Now
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
