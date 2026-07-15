"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";

type Product = {
  id: string; // corresponds to slug
  name: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  img: string;
  desc: string;
  sizes: string[];
  active: boolean;
};

export default function Shop() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [pincode, setPincode] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [inventory, setInventory] = useState<{ [key: string]: number } | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    (async () => {
      try {
        if (!slug) return;
        
        // Fetch Product
        const productSnap = await getDoc(doc(db, "products", slug));
        if (productSnap.exists()) {
          setProduct({ id: productSnap.id, ...productSnap.data() } as Product);
        }

        // Fetch Inventory
        const docSnap = await getDoc(doc(db, "inventory", slug));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const invData: any = {};
          // Map all stock_ fields
          Object.keys(data).forEach(k => {
            if (k.startsWith("stock_")) {
              invData[k.replace("stock_", "")] = data[k];
            }
          });
          setInventory(invData);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const getAvailableStock = (sizeStr: string) => {
    if (!inventory) return null; // loading state
    
    // Attempt to find alphanumeric key for generic matching
    let sizeKey = sizeStr.charAt(0);
    if (!["S", "M", "L", "XL"].includes(sizeKey)) {
        sizeKey = sizeStr.replace(/[^a-zA-Z0-9]/g, '');
    }
    
    return inventory[sizeKey] || 0;
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const stock = getAvailableStock(size);
    if (stock !== null && quantity > stock) {
      setQuantity(stock > 0 ? stock : 1);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("Please select a size first.");
      return;
    }

    addToCart({
      id: `${product.id}-${selectedSize}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      size: selectedSize || "",
      image: product.img || "/assets/men_s_ileostomy_belt_2_5.png",
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

  if (loading || !product) return null;

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
               <p className="font-public text-sm text-text-muted">{product.name} - {selectedSize} (Qty: {quantity})</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto w-full pt-8 sm:pt-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 relative">
          
          {/* Product Image Gallery */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6 sm:gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-surface-card rounded-2xl border border-text-muted/10 relative overflow-hidden aspect-square"
            >
              {product.badge && (
                <div className="absolute top-6 left-6 z-10 px-4 py-1.5 bg-primary text-background text-sm font-outfit font-bold rounded-full">
                  {product.badge}
                </div>
              )}
              <Image 
                src={product.img || "/assets/men_s_ileostomy_belt_2_5.png"} 
                alt={product.name} 
                fill 
                priority
                className="object-contain p-12 hover:scale-105 transition-transform duration-500 ease-out"
              />
            </motion.div>
            
            <div className="grid grid-cols-4 gap-4">
              <button className="bg-surface-card rounded-xl border-2 border-primary aspect-square relative overflow-hidden">
                <Image src={product.img || "/assets/men_s_ileostomy_belt_2_5.png"} alt="Thumbnail" fill className="object-contain p-2" />
              </button>
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
                {/* Title & Price */}
                <div className="mb-8">
                  <p className="font-public text-sm text-secondary font-bold mb-2 uppercase tracking-widest">
                    {product.tagline}
                  </p>
                  <h1 className="font-outfit text-4xl sm:text-5xl font-bold text-text-main mb-4">
                    {product.name}
                  </h1>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <span className="font-outfit text-3xl font-bold text-primary">₹{product.price}</span>
                    {product.originalPrice && (
                      <span className="font-outfit text-lg font-bold text-text-muted line-through opacity-70">
                        ₹{product.originalPrice}
                      </span>
                    )}
                    {product.originalPrice && (
                      <span className="bg-red-50 text-red-600 font-bold px-3 py-1 rounded-full text-sm border border-red-100">
                        Save ₹{product.originalPrice - product.price}
                      </span>
                    )}
                  </div>
                  {/* Description */}
                  <div className="prose prose-lg text-text-muted font-public mb-10">
                    <p>
                      {product.desc}
                    </p>
                  </div>
                </div>

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
                {product.sizes && product.sizes.length > 0 && (
                  <div className="flex flex-col gap-3 mb-8">
                    <div className="flex justify-between items-center" style={{ maxWidth: "448px" }}>
                      <h3 className="font-outfit text-lg font-bold text-text-main">Select Size</h3>
                      <a href="/contact#faq" className="font-public text-sm text-primary hover:underline">Sizing Guide</a>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {product.sizes.map(size => {
                        const stock = getAvailableStock(size);
                        const isOutOfStock = stock === 0;
                        return (
                          <button 
                            key={size}
                            disabled={isOutOfStock}
                            onClick={() => handleSizeSelect(size)}
                            className={`px-5 py-3 rounded-lg border-2 font-outfit font-bold transition-all relative ${
                              selectedSize === size 
                                ? 'border-primary text-primary bg-primary/5 shadow-md scale-105'
                                : isOutOfStock
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-70'
                                  : 'border-text-muted/20 bg-background text-text-main hover:border-primary/50'
                            }`}
                          >
                            {size}
                            {isOutOfStock && <span className="block text-xs font-normal text-red-500 mt-1">Out of Stock</span>}
                            {!isOutOfStock && stock !== null && stock <= 5 && <span className="block text-xs font-normal text-orange-500 mt-1">Only {stock} left!</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                      onClick={() => {
                        let maxQty = 10;
                        if (product.sizes && product.sizes.length > 0) {
                          maxQty = selectedSize ? (getAvailableStock(selectedSize) || 1) : 10;
                        } else {
                          maxQty = getAvailableStock("default") || 10;
                        }
                        
                        if (quantity < maxQty) setQuantity(quantity + 1);
                        else if (selectedSize || product.sizes?.length === 0) alert(`Only ${maxQty} available in stock.`);
                      }}
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
