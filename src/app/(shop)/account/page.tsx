"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Account() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (authLoading || !user) {
    return <div className="min-h-screen bg-background pt-32 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="font-outfit text-4xl font-bold text-text-main mb-2">My Account</h1>
            <p className="font-public text-text-muted">Manage your orders and account details.</p>
          </div>
          <button 
            onClick={logout}
            className="px-6 py-2 border border-red-500/30 text-red-500 rounded-lg font-outfit font-bold hover:bg-red-500/10 transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-surface-card p-6 rounded-2xl border border-text-muted/10 sticky top-28">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 mb-4 text-2xl font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-outfit text-xl font-bold text-text-main mb-1">Profile</h2>
              <p className="font-public text-sm text-text-muted mb-6">{user.email}</p>
              
              <div className="h-px bg-text-muted/20 my-4"></div>
              
              <div className="text-sm font-public text-text-muted">
                Need help? <Link href="/contact" className="text-primary font-bold hover:underline">Contact Support</Link>
              </div>
            </div>
          </div>

          {/* Right Column: Order History */}
          <div className="lg:col-span-2">
            <h2 className="font-outfit text-2xl font-bold text-text-main mb-6">Order History</h2>
            
            {loadingOrders ? (
              <div className="text-text-muted font-public">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="bg-surface-card p-10 rounded-2xl border border-text-muted/10 text-center">
                <p className="font-public text-text-muted mb-4">You haven't placed any orders yet.</p>
                <Link href="/shop" className="inline-block bg-primary text-background px-6 py-3 rounded-lg font-outfit font-bold hover:opacity-90">
                  Shop Now
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {orders.map((order, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={order.id} 
                    className="bg-surface-card p-6 rounded-2xl border border-text-muted/10"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-text-muted/10">
                      <div>
                        <div className="font-public text-xs text-text-muted mb-1">Order ID: {order.id}</div>
                        <div className="font-public text-xs text-text-muted">
                          Placed on: {order.createdAt?.toDate().toLocaleDateString() || "Just now"}
                        </div>
                      </div>
                      <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-outfit font-bold text-xs uppercase self-start sm:self-auto">
                        {order.status}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 mb-6">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-contain bg-background p-1" />
                          <div className="flex-1">
                            <h4 className="font-outfit font-bold text-sm text-text-main">{item.name}</h4>
                            <p className="font-public text-xs text-text-muted">Size: {item.size} • Qty: {item.quantity}</p>
                          </div>
                          <div className="font-outfit font-bold text-primary text-sm">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                      <div>
                        <p className="font-public text-xs text-text-muted mb-1">Shipping To:</p>
                        <p className="font-outfit text-sm text-text-main">
                          {order.shippingAddress.fullName}<br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-public text-xs text-text-muted mb-1">Total Amount</p>
                        <p className="font-outfit font-bold text-xl text-primary">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
