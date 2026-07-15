"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "orders", orderId as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return <div className="min-h-screen bg-background pt-32 text-center">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background pt-32 text-center px-6">
        <h1 className="font-outfit text-3xl font-bold text-text-main mb-4">Order Not Found</h1>
        <p className="font-public text-text-muted mb-8">We couldn't find the order you're looking for.</p>
        <Link href="/" className="bg-primary text-background px-6 py-3 rounded-lg font-outfit font-bold hover:opacity-90">
          Go to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-6 sm:px-12 lg:px-20 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-2xl w-full bg-surface-card p-8 md:p-12 rounded-3xl border border-primary/20 shadow-xl text-center"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="font-outfit text-4xl font-bold text-text-main mb-4">Order Successful!</h1>
        <p className="font-public text-lg text-text-muted mb-8">
          Thank you for your purchase, <strong>{order.shippingAddress.fullName}</strong>. Your order has been placed and is being processed.
        </p>

        <div className="bg-background rounded-2xl p-6 border border-text-muted/10 text-left mb-8">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="font-public text-xs text-text-muted mb-1">Order ID</p>
              <p className="font-outfit font-bold text-text-main">{order.id}</p>
            </div>
            <div>
              <p className="font-public text-xs text-text-muted mb-1">Payment Method</p>
              <p className="font-outfit font-bold text-text-main uppercase">{order.paymentMethod}</p>
            </div>
          </div>
          
          <div className="h-px bg-text-muted/10 my-4"></div>
          
          <div>
            <p className="font-public text-xs text-text-muted mb-2">Shipping To</p>
            <p className="font-outfit font-bold text-text-main">
              {order.shippingAddress.address}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
          </div>
        </div>

        <Link href="/account" className="inline-block bg-primary text-background font-outfit font-bold text-lg py-4 px-10 rounded-xl hover:opacity-95 transition-all shadow-md active:scale-[0.98]">
          View My Account
        </Link>
      </motion.div>
    </div>
  );
}
