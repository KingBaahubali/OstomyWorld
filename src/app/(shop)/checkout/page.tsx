"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import Script from "next/script";

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
    if (!authLoading && !user) {
      // Silently redirect to login, preserving the destination
      router.push("/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const processSuccessfulOrder = async (paymentStatus: string, razorpayPaymentId?: string) => {
    try {
      const orderData = {
        userId: user!.uid,
        userEmail: user!.email,
        items,
        totalAmount: totalPrice,
        shippingAddress: formData,
        paymentMethod,
        paymentStatus,
        razorpayPaymentId: razorpayPaymentId || null,
        status: "processing",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      try {
        const shiprocketResponse = await fetch("/api/shiprocket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...orderData,
            orderId: docRef.id
          }),
        });
        
        if (!shiprocketResponse.ok) {
          console.error("Shiprocket integration returned an error:", await shiprocketResponse.text());
        }
      } catch (shiprocketError) {
        console.error("Failed to connect to Shiprocket API:", shiprocketError);
      }
      
      try {
        for (const item of items) {
          if (item.size) {
            const sizeKey = item.size.charAt(0); // "S", "M", "L"
            if (["S", "M", "L"].includes(sizeKey)) {
              await updateDoc(doc(db, "inventory", "ostobelt"), {
                [`stock_${sizeKey}`]: increment(-item.quantity)
              });
            }
          }
        }
      } catch (inventoryError) {
        console.error("Failed to update inventory:", inventoryError);
      }

      clearCart();
      router.push(`/order-success/${docRef.id}`);

    } catch (error) {
      console.error("Error saving order to database:", error);
      alert("Payment was successful, but there was an error saving your order. Please contact support.");
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    
    if (paymentMethod === 'cod') {
      await processSuccessfulOrder("pending");
      return;
    }

    if (paymentMethod === 'online') {
      try {
        const res = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(totalPrice * 100), // in paise
            receipt: `rcpt_${Date.now()}`
          })
        });

        const order = await res.json();
        
        if (!res.ok) {
          throw new Error(order.error || 'Failed to create Razorpay order');
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "Ostomy World",
          description: "Premium Ostomy Belts",
          order_id: order.order_id,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response)
              });
              
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                await processSuccessfulOrder("paid", response.razorpay_payment_id);
              } else {
                alert("Payment signature verification failed. Please contact support.");
                setIsSubmitting(false);
              }
            } catch (err) {
              console.error("Error during verification", err);
              alert("Error verifying payment.");
              setIsSubmitting(false);
            }
          },
          prefill: {
            name: formData.fullName,
            email: user.email,
            contact: formData.phone
          },
          theme: {
            color: "#3a9c3a"
          },
          modal: {
            ondismiss: function() {
              setIsSubmitting(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert(`Payment failed: ${response.error.description}`);
          setIsSubmitting(false);
        });
        rzp.open();

      } catch (error: any) {
        console.error("Razorpay error:", error);
        alert(error.message || "Failed to initialize payment gateway.");
        setIsSubmitting(false);
      }
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen bg-background pt-32 text-center">Loading...</div>;
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="min-h-screen bg-background pt-32 text-center flex flex-col items-center">
        <h2 className="font-outfit text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link href="/shop" className="bg-primary text-background px-6 py-3 rounded-lg font-outfit font-bold">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-6 sm:px-12 lg:px-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
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
                  <input
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={e => {
                      // Only letters and spaces
                      if (/^[a-zA-Z\s]*$/.test(e.target.value)) handleChange(e);
                    }}
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    autoComplete="name"
                    className="w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-public font-bold text-sm text-text-main mb-1">Phone Number</label>
                  <div className="flex">
                    <span className="flex items-center px-3 bg-surface-card border border-r-0 border-text-muted/30 rounded-l-lg font-public text-text-muted text-sm">+91</span>
                    <input
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 10) setFormData({ ...formData, phone: val });
                      }}
                      type="tel"
                      inputMode="numeric"
                      placeholder="9876543210"
                      maxLength={10}
                      autoComplete="tel"
                      className={`flex-1 bg-background border border-text-muted/30 rounded-r-lg px-4 py-3 font-public focus:outline-none focus:border-primary ${
                        formData.phone && formData.phone.length < 10 ? "border-red-400" : ""
                      }`}
                    />
                  </div>
                  {formData.phone && formData.phone.length < 10 && (
                    <p className="text-red-500 text-xs mt-1 font-public">Phone number must be 10 digits</p>
                  )}
                </div>
                <div>
                  <label className="block font-public font-bold text-sm text-text-main mb-1">Pincode</label>
                  <input
                    required
                    name="pincode"
                    value={formData.pincode}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 6) setFormData({ ...formData, pincode: val });
                    }}
                    type="text"
                    inputMode="numeric"
                    placeholder="500001"
                    maxLength={6}
                    className={`w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary ${
                      formData.pincode && formData.pincode.length < 6 ? "border-red-400" : ""
                    }`}
                  />
                  {formData.pincode && formData.pincode.length < 6 && (
                    <p className="text-red-500 text-xs mt-1 font-public">Pincode must be 6 digits</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block font-public font-bold text-sm text-text-main mb-1">Address (House No, Building, Street)</label>
                  <input
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    type="text"
                    placeholder="e.g. 12B, Green Park Apartments, MG Road"
                    autoComplete="street-address"
                    className="w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-public font-bold text-sm text-text-main mb-1">City</label>
                  <input
                    required
                    name="city"
                    value={formData.city}
                    onChange={e => {
                      if (/^[a-zA-Z\s]*$/.test(e.target.value)) handleChange(e);
                    }}
                    type="text"
                    placeholder="e.g. Hyderabad"
                    autoComplete="address-level2"
                    className="w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-public font-bold text-sm text-text-main mb-1">State</label>
                  <input
                    required
                    name="state"
                    value={formData.state}
                    onChange={e => {
                      if (/^[a-zA-Z\s]*$/.test(e.target.value)) handleChange(e);
                    }}
                    type="text"
                    placeholder="e.g. Telangana"
                    autoComplete="address-level1"
                    className="w-full bg-background border border-text-muted/30 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary"
                  />
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
              disabled={isSubmitting}
              className="w-full text-center bg-primary text-background font-outfit font-bold text-lg py-4 rounded-xl hover:opacity-95 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Processing..."
                : paymentMethod === "online"
                ? "Pay with Razorpay →"
                : "Place Order →"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
