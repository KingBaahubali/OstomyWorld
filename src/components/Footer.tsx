import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Shop", href: "/shop" },
  { name: "Contact Us", href: "/contact" },
];

const supportLinks = [
  { name: "How to Wear", href: "/#how-to-wear" },
  { name: "Sizing Guide", href: "/contact#faq" },
  { name: "Returns & Refunds", href: "/contact#faq" },
  { name: "Track Your Order", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-text-main text-white">
      {/* Main Footer Body */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Image
              src="/assets/full logo white.png"
              alt="Ostomy World"
              width={200}
              height={60}
              className="object-contain mb-5"
            />
            <p className="font-public text-white/60 text-sm leading-relaxed max-w-xs">
              India&apos;s first premium active-support belt for ostomates. Built by an ostomate, for ostomates.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href="mailto:support@ostomyworld.in"
                className="text-white/60 hover:text-primary transition-colors font-public text-sm"
              >
                support@ostomyworld.in
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-outfit font-bold text-white text-sm uppercase tracking-widest mb-5">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-public text-white/60 text-sm hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-outfit font-bold text-white text-sm uppercase tracking-widest mb-5">
              Support
            </h4>
            <ul className="flex flex-col gap-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="font-public text-white/60 text-sm hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-public text-white/40 text-xs">
            © 2026 Ostomy World. All rights reserved.
          </span>
          <span className="font-public text-white/40 text-xs">
            Made in India 🇮🇳
          </span>
        </div>
      </div>
    </footer>
  );
}
