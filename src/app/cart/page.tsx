"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-6 sm:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-outfit text-4xl font-bold text-text-main mb-8">Your Cart</h1>
        
        {items.length === 0 ? (
          <div className="text-center py-20 bg-surface-card rounded-2xl border border-text-muted/10">
            <h2 className="font-outfit text-2xl font-bold text-text-main mb-4">Your cart is empty</h2>
            <p className="font-public text-text-muted mb-8">Looks like you haven't added anything yet.</p>
            <Link href="/shop" className="bg-primary text-background font-outfit font-bold py-3 px-8 rounded-xl hover:opacity-95 transition-all">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Cart Items List */}
            <div className="flex-1 flex flex-col gap-6">
              {items.map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={item.id} 
                  className="flex gap-6 bg-surface-card p-4 rounded-2xl border border-text-muted/10 items-center relative"
                >
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-4 right-4 text-text-muted hover:text-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>

                  <div className="w-24 h-24 bg-background rounded-xl relative overflow-hidden flex-shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-contain p-2" sizes="96px" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-outfit font-bold text-lg text-text-main">{item.name}</h3>
                    <p className="font-public text-sm text-text-muted mb-2">Size: {item.size}</p>
                    <div className="font-outfit font-bold text-primary text-lg">
                      ₹{item.price.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="flex items-center border border-text-muted/30 rounded-lg overflow-hidden bg-background">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 font-bold hover:bg-text-muted/10">-</button>
                    <span className="px-3 py-1 font-outfit font-bold border-x border-text-muted/30 min-w-[40px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 font-bold hover:bg-text-muted/10">+</button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-surface-card p-6 rounded-2xl border border-text-muted/10 sticky top-28">
                <h3 className="font-outfit font-bold text-xl text-text-main mb-6">Order Summary</h3>
                <div className="flex justify-between font-public text-text-main mb-3">
                  <span>Subtotal</span>
                  <span className="font-bold">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-public text-text-main mb-3">
                  <span>Shipping</span>
                  <span className="font-bold text-green-600">Free</span>
                </div>
                <div className="h-px bg-text-muted/20 my-4"></div>
                <div className="flex justify-between font-outfit text-xl font-bold text-text-main mb-8">
                  <span>Total</span>
                  <span className="text-primary">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                
                <Link href="/checkout" className="block w-full text-center bg-primary text-background font-outfit font-bold text-lg py-4 rounded-xl hover:opacity-95 transition-all shadow-md active:scale-[0.98]">
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
