"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

export default function Shop() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [pincode, setPincode] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const { addToCart } = useCart();

  const handleBuyNow = () => {
    if (!selectedSize) {
      alert("Please select a size first.");
      return;
    }
    
    addToCart({
      id: `ostobelt-${selectedSize}`,
      productId: "ostobelt",
      name: "OstoBelt Active Support",
      size: selectedSize,
      price: 2799,
      quantity,
      image: "/assets/men_s_ileostomy_belt_2_5.png"
    });

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      alert(`Delivery available to ${pincode} within 3-5 business days.`);
    } else {
      alert("Please enter a valid 6-digit pincode.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pt-12 pb-24 px-6 sm:px-12 lg:px-20 relative">
      {/* Premium Cart Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-28 left-1/2 -translate-x-1/2 z-50 bg-surface-card border border-primary/30 shadow-2xl rounded-2xl p-4 flex items-center gap-4 min-w-[320px]"
          >
             <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
               ✓
             </div>
             <div>
               <h4 className="font-outfit font-bold text-text-main">Added to Cart</h4>
               <p className="font-public text-sm text-text-muted">OstoBelt Active Support - {selectedSize} (Qty: {quantity})</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto w-full pt-8 sm:pt-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-20"
        >
          <h1 className="font-outfit text-4xl sm:text-5xl md:text-6xl font-bold text-text-main mb-6">
            The OstoBelt. One Product. Total Freedom.
          </h1>
          <p className="font-public text-lg sm:text-xl text-text-muted max-w-3xl mx-auto leading-relaxed">
            India&apos;s first premium active-support belt for ostomates — designed to secure your appliance discreetly under any clothing, so you never have to think twice.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 relative">
          
          {/* Product Image Gallery */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6 sm:gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-surface-card rounded-2xl p-8 sm:p-12 border border-text-muted/10 flex justify-center items-center relative aspect-square shadow-sm overflow-hidden group"
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
               <Image
                 src="/assets/men_s_ileostomy_belt_2_5.png"
                 alt="OstoBelt Front View"
                 fill
                 className="object-contain p-8 sm:p-12 group-hover:scale-105 transition-transform duration-700"
                 priority
               />
            </motion.div>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-8">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 0.4 }}
                 className="bg-surface-card rounded-2xl p-4 sm:p-8 border border-text-muted/10 aspect-square relative shadow-sm group overflow-hidden"
               >
                 <Image
                   src="/assets/men_colostomy_belt_back_1_1.png"
                   alt="OstoBelt Back View"
                   fill
                   className="object-contain p-4 sm:p-8 group-hover:scale-110 transition-transform duration-500"
                 />
               </motion.div>
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 0.5 }}
                 className="bg-surface-card rounded-2xl p-4 sm:p-8 border border-text-muted/10 aspect-square relative shadow-sm group overflow-hidden"
               >
                 <Image
                   src="/assets/hom222.png"
                   alt="OstoBelt Detail View"
                   fill
                   className="object-contain p-4 sm:p-8 group-hover:scale-110 transition-transform duration-500"
                 />
               </motion.div>
            </div>
          </div>

          {/* E-Commerce Product Actions */}
          <div className="w-full lg:w-1/2">
            <div className="sticky top-32 flex flex-col">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h2 className="font-outfit text-3xl md:text-5xl font-bold text-text-main mb-2">
                  OstoBelt Active Support
                </h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="font-outfit text-4xl font-bold text-primary">
                    ₹2,799
                  </div>
                  <div className="font-outfit text-2xl font-bold text-text-muted line-through opacity-70">
                    ₹3,099
                  </div>
                </div>
                
                <p className="font-public text-text-muted text-lg mb-8 border-b border-text-muted/20 pb-8">
                  Premium active-support belt designed to secure your pouch close to the body with a discreet flange-lock system. Free shipping across India.
                </p>

                {/* Check Pincode */}
                <div className="mb-8">
                  <h3 className="font-outfit text-lg font-bold text-text-main mb-3">Delivery Options</h3>
                  <form onSubmit={handlePincodeCheck} className="flex gap-3" style={{ maxWidth: "384px" }}>
                    <input 
                      type="text" 
                      placeholder="Enter Pincode" 
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      maxLength={6}
                      pattern="[0-9]{6}"
                      className="flex-1 bg-surface-card border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                    <button type="submit" className="bg-text-main text-white font-outfit font-bold px-6 py-3 rounded-lg hover:bg-black transition-colors">
                      Check
                    </button>
                  </form>
                </div>

                {/* Select Size */}
                <div className="flex flex-col gap-3 mb-8">
                  <div className="flex justify-between items-center" style={{ maxWidth: "448px" }}>
                    <h3 className="font-outfit text-lg font-bold text-text-main">Select Size (Waist)</h3>
                    <a href="/contact#faq" className="font-public text-sm text-primary hover:underline">Sizing Guide</a>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {['S (28"-32")', 'M (33"-37")', 'L (38"-42")'].map(size => (
                      <button 
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-5 py-3 rounded-lg border-2 font-outfit font-bold transition-all ${
                          selectedSize === size 
                            ? 'border-primary text-primary bg-primary/5 shadow-md scale-105'
                            : 'border-text-muted/20 bg-background text-text-main hover:border-primary/50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-10">
                  <h3 className="font-outfit text-lg font-bold text-text-main mb-3">Quantity</h3>
                  <div className="flex items-center border border-text-muted/30 rounded-lg w-fit overflow-hidden bg-surface-card">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-5 py-2 font-bold text-text-main hover:bg-text-muted/10 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-6 py-2 font-outfit font-bold border-x border-text-muted/30 text-lg min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-5 py-2 font-bold text-text-main hover:bg-text-muted/10 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Cart */}
                <button 
                  onClick={handleBuyNow}
                  className="bg-primary text-background font-outfit font-bold text-xl py-5 px-8 rounded-xl hover:opacity-95 transition-all w-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98]"
                  style={{ maxWidth: "448px" }}
                >
                  {selectedSize ? `Add to Cart — ₹${(2799 * quantity).toLocaleString('en-IN')}` : `Select Size to Buy`}
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Product Details Section (Moved Below) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mt-24 pt-16 border-t border-text-muted/20 max-w-4xl mx-auto"
        >
          <div className="mb-16 text-center">
            <h2 className="font-outfit text-3xl md:text-4xl font-bold text-text-main mb-6">
              Designed for Uncompromising Activity
            </h2>
            <p className="font-public text-text-muted text-lg md:text-xl leading-relaxed">
              The OstoBelt Active Support is a medical-grade waist belt engineered for ostomates who refuse to slow down. Made from premium anti-microbial stretch fabric, it secures your ostomy pouch close to the body with a discreet flange-lock system — so you can run, swim, travel, and live without anxiety.
            </p>
          </div>

          <div className="bg-surface-card p-8 sm:p-12 rounded-2xl border border-text-muted/10 shadow-sm">
            <h3 className="font-outfit text-2xl font-bold text-text-main mb-8 text-center">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold font-outfit">1</div>
                <div>
                  <strong className="block text-text-main font-outfit text-xl mb-2">Flange-Lock Pouch System</strong>
                  <span className="font-public text-text-muted leading-relaxed">A discreet inner pocket with a pre-cut flange hole that keeps your bag flush, flat, and completely concealed.</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold font-outfit">2</div>
                <div>
                  <strong className="block text-text-main font-outfit text-xl mb-2">Anti-Microbial Fabric</strong>
                  <span className="font-public text-text-muted leading-relaxed">Breathable, moisture-wicking, and skin-safe. Comfortable for all-day wear, every day of the week.</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold font-outfit">3</div>
                <div>
                  <strong className="block text-text-main font-outfit text-xl mb-2">Adjustable Velcro Closure</strong>
                  <span className="font-public text-text-muted leading-relaxed">A secure, customisable fit with zero slippage, even during intense physical activity.</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold font-outfit">4</div>
                <div>
                  <strong className="block text-text-main font-outfit text-xl mb-2">Bottom Zipper Access</strong>
                  <span className="font-public text-text-muted leading-relaxed">Drain or empty your pouch discreetly without ever needing to remove the belt.</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
