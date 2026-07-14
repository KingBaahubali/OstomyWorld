"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const products = [
  {
    slug: "ostobelt",
    name: "OstoBelt Active Support",
    tagline: "Secure. Discreet. Built for life.",
    price: "₹2,499",
    badge: "Bestseller",
    img: "/assets/men_s_ileostomy_belt_2_5.png",
    desc: "India's first premium active-support belt for ostomates. Secures your pouch completely under any clothing.",
  },
];

export default function Shop() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 lg:px-20 pt-16 pb-24">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-12"
        >
          <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-outfit font-bold text-sm rounded-full mb-5 border border-primary/20">
            Shop
          </div>
          <h1 className="font-outfit text-4xl sm:text-5xl font-bold text-text-main mb-3">
            Our Products
          </h1>
          <p className="font-public text-lg text-text-muted">
            Engineered for ostomates who refuse to slow down.
          </p>
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, idx) => (
            <motion.div
              key={product.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.1, ease: "easeOut" }}
            >
              <Link href={`/shop/${product.slug}`} className="group block h-full">
                <div className="bg-surface-card rounded-2xl border border-text-muted/10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full flex flex-col">

                  {/* Product Image */}
                  <div className="relative aspect-square bg-background overflow-hidden">
                    {product.badge && (
                      <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-primary text-background text-xs font-outfit font-bold rounded-full">
                        {product.badge}
                      </div>
                    )}
                    <Image
                      src={product.img}
                      alt={product.name}
                      fill
                      className="object-contain p-10 group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-6 flex flex-col flex-1">
                    <p className="font-public text-xs text-secondary font-bold mb-1 uppercase tracking-widest">
                      {product.tagline}
                    </p>
                    <h2 className="font-outfit text-xl font-bold text-text-main mb-3">
                      {product.name}
                    </h2>
                    <p className="font-public text-text-muted text-sm leading-relaxed mb-6 flex-1">
                      {product.desc}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-outfit text-2xl font-bold text-primary">
                        {product.price}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-outfit font-bold text-sm text-text-main group-hover:text-primary transition-colors">
                        View Product
                        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                      </span>
                    </div>
                  </div>

                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
