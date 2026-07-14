"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If auth is loaded and user is not logged in, redirect to login
    if (!authLoading && !user) {
      alert("Please sign in to continue to checkout.");
      router.push("/login");
    }
    // If cart is empty, redirect to shop
    if (items.length === 0) {
      router.push("/shop");
    }
  }, [user, authLoading, items, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Create order in Firestore
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        items,
        totalAmount: totalPrice,
        shippingAddress: formData,
        paymentMethod,
        status: "processing", // pending, processing, shipped, delivered
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      // 2. Clear cart
      clearCart();
      
      // 3. Redirect to success page
      router.push(`/order-success/${docRef.id}`);

    } catch (error) {
      console.error("Error placing order:", error);
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || items.length === 0) {
    return <div className="min-h-screen bg-background pt-32 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-6 sm:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
        
        {/* Left Column: Shipping & Payment */}
        <div className="flex-1">
          <h1 className="font-outfit text-3xl font-bold text-text-main mb-8">Checkout</h1>
          
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="flex flex-col gap-8">
            
            {/* Shipping Details */}
            <div className="bg-surface-card p-6 md:p-8 rounded-2xl border border-text-muted/10">
              <h2 className="font-outfit text-xl font-bold text-text-main mb-6">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-public font-bold text-sm text-text-main mb-1">Full Name</label>
                  <input required name="fullName" value={formData.fullName} onChange={handleChange} type="text" className="w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block font-public font-bold text-sm text-text-main mb-1">Phone Number</label>
                  <input required name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block font-public font-bold text-sm text-text-main mb-1">Pincode</label>
                  <input required name="pincode" value={formData.pincode} onChange={handleChange} type="text" maxLength={6} className="w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-public font-bold text-sm text-text-main mb-1">Address (House No, Building, Street)</label>
                  <input required name="address" value={formData.address} onChange={handleChange} type="text" className="w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block font-public font-bold text-sm text-text-main mb-1">City</label>
                  <input required name="city" value={formData.city} onChange={handleChange} type="text" className="w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block font-public font-bold text-sm text-text-main mb-1">State</label>
                  <input required name="state" value={formData.state} onChange={handleChange} type="text" className="w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-surface-card p-6 md:p-8 rounded-2xl border border-text-muted/10">
              <h2 className="font-outfit text-xl font-bold text-text-main mb-6">Payment Method</h2>
              
              <div className="flex flex-col gap-3">
                <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-text-muted/30 hover:border-primary/50'}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 accent-primary" />
                  <div className="flex-1">
                    <div className="font-outfit font-bold text-text-main">Cash on Delivery (COD)</div>
                    <div className="font-public text-sm text-text-muted">Pay when the product arrives at your doorstep.</div>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-text-muted/30 hover:border-primary/50'}`}>
                  <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="w-5 h-5 accent-primary" />
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <div className="font-outfit font-bold text-text-main">Pay Online (Razorpay)</div>
                      <div className="font-public text-sm text-text-muted">UPI, Cards, Netbanking</div>
                    </div>
                    <div className="text-xs bg-primary/10 text-primary font-bold px-2 py-1 rounded">Coming Soon</div>
                  </div>
                </label>
              </div>
            </div>

          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-surface-card p-6 rounded-2xl border border-text-muted/10 sticky top-28">
            <h3 className="font-outfit font-bold text-xl text-text-main mb-6">Order Summary</h3>
            
            <div className="flex flex-col gap-4 mb-6 max-h-60 overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-background rounded-lg flex-shrink-0 overflow-hidden relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-outfit font-bold text-text-main text-sm truncate">{item.name}</div>
                    <div className="font-public text-xs text-text-muted">Size: {item.size} • Qty: {item.quantity}</div>
                  </div>
                  <div className="font-outfit font-bold text-primary text-sm">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px bg-text-muted/20 my-4"></div>
            
            <div className="flex justify-between font-public text-sm text-text-main mb-3">
              <span>Subtotal</span>
              <span className="font-bold">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-public text-sm text-text-main mb-3">
              <span>Shipping</span>
              <span className="font-bold text-green-600">Free</span>
            </div>
            
            <div className="h-px bg-text-muted/20 my-4"></div>
            
            <div className="flex justify-between font-outfit text-xl font-bold text-text-main mb-8">
              <span>Total</span>
              <span className="text-primary">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
            
            <button 
              type="submit"
              form="checkout-form"
              disabled={isSubmitting || paymentMethod === 'online'}
              className="w-full text-center bg-primary text-background font-outfit font-bold text-lg py-4 rounded-xl hover:opacity-95 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
