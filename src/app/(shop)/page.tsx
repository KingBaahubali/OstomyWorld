"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import HomeStepper from "@/components/HomeStepper";

// Reusable scroll-reveal wrapper
const FadeUp = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 36 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const SlideIn = ({
  children,
  direction = "left",
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  direction?: "left" | "right";
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, x: direction === "left" ? -40 : 40 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ── HERO — instant render, no delay ── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">

        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/hero_family_v2.jpg"
            alt="Family enjoying life"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          {/* Cloudy white overlay */}
          <div className="absolute inset-0 bg-white/60" />
          {/* Stronger fade on left so text is crisp */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/55 to-transparent" />
        </div>

        {/* Hero text — animates immediately on mount, very fast */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 py-24">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="font-public text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest mb-4"
          >
            Ostomy Support Belt
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="font-outfit font-bold text-text-main leading-tight mb-5"
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
              maxWidth: "580px",
            }}
          >
            Regain Your<br />Confidence.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" }}
            className="font-public text-base sm:text-lg text-text-muted mb-10 leading-relaxed"
            style={{ maxWidth: "460px" }}
          >
            The OstoBelt secures your ostomy pouch completely under your clothing — so you can get back to the gym, the office, the family function.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.25, ease: "easeOut" }}
          >
            <Link
              href="/shop"
              className="group relative inline-flex items-center justify-center px-8 sm:px-10 py-4 font-outfit font-bold text-sm sm:text-base text-background bg-primary rounded-full overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-primary/25 uppercase tracking-widest"
            >
              <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full rounded-full" />
              <span className="relative">Shop Now</span>
            </Link>
          </motion.div>
        </div>

      </section>

      {/* ── TRUST BANNER — scroll reveal ── */}
      <section className="bg-surface-card py-16 sm:py-20 px-6 sm:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16">

          <SlideIn direction="left" className="flex-1 min-w-0">
            <h2 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-bold text-text-main mb-4">
              Founded by an Ostomate,<br className="hidden sm:block" /> for the Ostomy Community.
            </h2>
            <div className="w-14 h-1 bg-secondary rounded-full mb-6" />
            <p className="font-public text-text-muted text-base sm:text-lg leading-relaxed mb-8">
              Our founder underwent ostomy surgery at 19. After years of finding no product built for an active, modern lifestyle, he built the OstoBelt from scratch. Ostomy World exists so no one else has to wait as long as he did.
            </p>
            <div className="inline-flex flex-wrap items-center gap-3 bg-background px-4 py-3 rounded-md shadow-sm border border-text-muted/10">
              <span className="font-outfit font-bold text-primary text-base sm:text-lg whitespace-nowrap">Ostomy World</span>
              <span className="text-text-muted font-public text-xs sm:text-sm border-l border-text-muted/30 pl-3 whitespace-nowrap">— Founder & CEO</span>
            </div>
          </SlideIn>

          <SlideIn direction="right" delay={0.1} className="flex-shrink-0 w-full md:w-auto">
            <motion.div
              whileHover={{ scale: 1.02, rotate: -1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="rounded-xl overflow-hidden bg-background p-2 shadow-xl border border-text-muted/10 mx-auto md:mx-0"
              style={{ maxWidth: "460px" }}
            >
              <Image
                src="/assets/Thank you card.jpg"
                alt="Ostomy World Founder"
                width={460}
                height={300}
                className="object-cover rounded-lg w-full"
              />
            </motion.div>
          </SlideIn>

        </div>
      </section>

      {/* ── PRODUCT HIGHLIGHT STRIP — scroll reveal ── */}
      <section className="py-14 sm:py-16 px-6 sm:px-12 lg:px-20 bg-background">
        <FadeUp className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { stat: "360°", label: "Pouch Coverage" },
              { stat: "All-Day", label: "Wearable Comfort" },
              { stat: "3 Sizes", label: "S / M / L" },
              { stat: "Free", label: "Shipping Across India" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
                className="flex flex-col items-center gap-2 p-4 sm:p-6 rounded-2xl bg-surface-card border border-text-muted/10"
              >
                <span className="font-outfit text-2xl sm:text-3xl font-bold text-primary">{item.stat}</span>
                <span className="font-public text-xs sm:text-sm text-text-muted leading-snug">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* ── HOW TO WEAR — scroll reveal handled inside HomeStepper ── */}
      <FadeUp>
        <HomeStepper />
      </FadeUp>


    </div>
  );
}
