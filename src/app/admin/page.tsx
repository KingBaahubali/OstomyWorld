"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  query,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// ─── IMPORTANT: Replace this with YOUR Firebase UID ───────────────────────────
// Find it in Firebase Console → Authentication → Users → copy your UID
const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID || "";

type Order = {
  id: string;
  userEmail: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus?: string;
  razorpayPaymentId?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: { name: string; size: string; quantity: number; price: number }[];
  createdAt: any;
};

type Coupon = {
  id: string;
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  active: boolean;
};

const ORDER_STATUSES = ["processing", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  processing: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

// ─── TABS ─────────────────────────────────────────────────────────────────────
type Tab = "orders" | "inventory" | "coupons";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Coupon form
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"percent" | "flat">("percent");
  const [couponValue, setCouponValue] = useState("");
  const [savingCoupon, setSavingCoupon] = useState(false);

  const isAdmin = user && (user.uid === ADMIN_UID || user.email === "ostomyworld.in@gmail.com");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (!authLoading && user && !isAdmin) {
      router.push("/");
    }
  }, [user, authLoading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        // Fetch orders
        const ordersSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
        const fetchedOrders: Order[] = ordersSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as Order));
        setOrders(fetchedOrders);

        // Fetch coupons
        const couponsSnap = await getDocs(collection(db, "coupons"));
        const fetchedCoupons: Coupon[] = couponsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as Coupon));
        setCoupons(fetchedCoupons);
      } catch (e) {
        console.error("Error fetching admin data:", e);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (e) {
      alert("Failed to update order status.");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const createCoupon = async () => {
    if (!couponCode.trim() || !couponValue) return;
    setSavingCoupon(true);
    try {
      const data = {
        code: couponCode.trim().toUpperCase(),
        discountType: couponType,
        discountValue: Number(couponValue),
        active: true,
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "coupons"), data);
      setCoupons((prev) => [...prev, { id: ref.id, ...data } as Coupon]);
      setCouponCode("");
      setCouponValue("");
    } catch (e) {
      alert("Failed to create coupon.");
    } finally {
      setSavingCoupon(false);
    }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    try {
      await updateDoc(doc(db, "coupons", coupon.id), { active: !coupon.active });
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c))
      );
    } catch (e) {
      alert("Failed to toggle coupon.");
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await deleteDoc(doc(db, "coupons", id));
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert("Failed to delete coupon.");
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-outfit text-text-muted">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-outfit text-text-muted">Access denied.</div>;
  }

  // Stats
  const totalRevenue = orders.filter(o => o.paymentStatus === "paid").reduce((s, o) => s + o.totalAmount, 0);
  const todayOrders = orders.filter(o => {
    if (!o.createdAt?.toDate) return false;
    const d = o.createdAt.toDate();
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
  }).length;

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm font-outfit">OW</div>
          <div>
            <h1 className="font-outfit font-bold text-gray-900 text-lg">Admin Dashboard</h1>
            <p className="font-public text-xs text-gray-500">Ostomy World</p>
          </div>
        </div>
        <span className="font-public text-sm text-gray-500">{user.email}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Orders", value: orders.length, color: "text-primary" },
            { label: "Today's Orders", value: todayOrders, color: "text-blue-600" },
            { label: "Revenue (Online)", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "text-green-600" },
            { label: "Active Coupons", value: coupons.filter(c => c.active).length, color: "text-purple-600" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className={`font-outfit font-bold text-2xl ${stat.color} mb-1`}>{stat.value}</div>
              <div className="font-public text-xs text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 shadow-sm mb-6 w-fit">
          {(["orders", "inventory", "coupons"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg font-outfit font-bold text-sm capitalize transition-all ${
                activeTab === tab
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── ORDERS TAB ──────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {loadingData ? (
              <div className="text-center py-16 text-gray-400 font-public">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <p className="font-outfit text-xl font-bold text-gray-400">No orders yet</p>
                <p className="font-public text-sm text-gray-400 mt-2">Orders will appear here when customers buy.</p>
              </div>
            ) : (
              orders.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Order Row */}
                  <div
                    className="flex flex-wrap items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-outfit font-bold text-gray-900 text-sm">#{order.id.slice(-8).toUpperCase()}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-400 font-public">
                          {order.paymentMethod === "online" ? "💳 Online" : "💰 COD"}
                        </span>
                      </div>
                      <div className="font-public text-sm text-gray-500 mt-0.5 truncate">{order.userEmail}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-outfit font-bold text-primary">₹{order.totalAmount?.toLocaleString("en-IN")}</div>
                      <div className="font-public text-xs text-gray-400">
                        {order.createdAt?.toDate
                          ? order.createdAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </div>
                    </div>
                    <div className="text-gray-300 text-lg">{expandedOrder === order.id ? "▲" : "▼"}</div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Shipping Address */}
                      <div>
                        <h4 className="font-outfit font-bold text-gray-700 text-sm mb-2">📦 Ship To</h4>
                        <div className="font-public text-sm text-gray-600 space-y-0.5">
                          <p className="font-bold text-gray-800">{order.shippingAddress?.fullName}</p>
                          <p>{order.shippingAddress?.phone}</p>
                          <p>{order.shippingAddress?.address}</p>
                          <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <h4 className="font-outfit font-bold text-gray-700 text-sm mb-2">🛒 Items</h4>
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between font-public text-sm text-gray-600">
                            <span>{item.name} (Size: {item.size}) × {item.quantity}</span>
                            <span className="font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                        {order.razorpayPaymentId && (
                          <p className="text-xs text-gray-400 mt-2">Payment ID: {order.razorpayPaymentId}</p>
                        )}
                      </div>

                      {/* Status Updater */}
                      <div className="md:col-span-2">
                        <h4 className="font-outfit font-bold text-gray-700 text-sm mb-2">🔄 Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {ORDER_STATUSES.map((s) => (
                            <button
                              key={s}
                              disabled={updatingOrder === order.id || order.status === s}
                              onClick={() => updateOrderStatus(order.id, s)}
                              className={`px-4 py-2 rounded-lg font-outfit font-bold text-xs capitalize transition-all disabled:opacity-50 ${
                                order.status === s
                                  ? "bg-primary text-white"
                                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                              }`}
                            >
                              {updatingOrder === order.id && order.status !== s ? "..." : s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ── INVENTORY TAB ────────────────────────────────────────── */}
        {activeTab === "inventory" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-outfit font-bold text-xl text-gray-800 mb-2">Product Inventory</h2>
            <p className="font-public text-sm text-gray-500 mb-6">Current products and pricing. Update pricing directly in the code or via the product page.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-public">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 font-outfit font-bold text-gray-500 text-xs uppercase tracking-wider">Product</th>
                    <th className="text-left py-3 font-outfit font-bold text-gray-500 text-xs uppercase tracking-wider">SKU</th>
                    <th className="text-left py-3 font-outfit font-bold text-gray-500 text-xs uppercase tracking-wider">Price</th>
                    <th className="text-left py-3 font-outfit font-bold text-gray-500 text-xs uppercase tracking-wider">Sizes</th>
                    <th className="text-left py-3 font-outfit font-bold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "OstoBelt Active Support", sku: "OSTOBELT-001", price: "₹2,799", sizes: "S / M / L", status: "In Stock" },
                  ].map((p) => (
                    <tr key={p.sku} className="border-b border-gray-50">
                      <td className="py-4 font-outfit font-bold text-gray-800">{p.name}</td>
                      <td className="py-4 text-gray-500">{p.sku}</td>
                      <td className="py-4 text-primary font-bold">{p.price}</td>
                      <td className="py-4 text-gray-600">{p.sizes}</td>
                      <td className="py-4">
                        <span className="bg-green-100 text-green-700 font-bold text-xs px-3 py-1 rounded-full">{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-public text-xs text-gray-400 mt-6">💡 Tip: To change the product price, update it in <code className="bg-gray-100 px-1 py-0.5 rounded">src/app/shop/ostobelt/page.tsx</code>. The admin dashboard reflects real orders automatically.</p>
          </div>
        )}

        {/* ── COUPONS TAB ──────────────────────────────────────────── */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            {/* Create Coupon */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-outfit font-bold text-xl text-gray-800 mb-5">Create Discount Coupon</h2>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block font-public font-bold text-xs text-gray-600 mb-1">Coupon Code</label>
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME20"
                    className="border border-gray-200 rounded-lg px-4 py-2.5 font-outfit font-bold text-sm focus:outline-none focus:border-primary w-44 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-public font-bold text-xs text-gray-600 mb-1">Type</label>
                  <select
                    value={couponType}
                    onChange={e => setCouponType(e.target.value as "percent" | "flat")}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 font-public text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="percent">% Discount</option>
                    <option value="flat">₹ Flat Off</option>
                  </select>
                </div>
                <div>
                  <label className="block font-public font-bold text-xs text-gray-600 mb-1">
                    Value ({couponType === "percent" ? "%" : "₹"})
                  </label>
                  <input
                    value={couponValue}
                    onChange={e => setCouponValue(e.target.value)}
                    type="number"
                    min="1"
                    placeholder={couponType === "percent" ? "20" : "200"}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 font-public text-sm focus:outline-none focus:border-primary w-28"
                  />
                </div>
                <button
                  onClick={createCoupon}
                  disabled={savingCoupon || !couponCode || !couponValue}
                  className="bg-primary text-white font-outfit font-bold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {savingCoupon ? "Creating..." : "Create Coupon"}
                </button>
              </div>
            </div>

            {/* Coupon List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-outfit font-bold text-lg text-gray-800 mb-4">All Coupons</h3>
              {coupons.length === 0 ? (
                <p className="font-public text-sm text-gray-400">No coupons yet. Create your first one above!</p>
              ) : (
                <div className="space-y-3">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="flex items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="font-outfit font-bold text-gray-800 tracking-widest text-sm bg-gray-100 px-3 py-1 rounded-lg">{coupon.code}</span>
                        <span className="font-public text-sm text-gray-600">
                          {coupon.discountType === "percent" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${coupon.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {coupon.active ? "Active" : "Inactive"}
                        </span>
                        <button onClick={() => toggleCoupon(coupon)} className="text-xs font-outfit font-bold text-primary border border-primary/30 px-3 py-1 rounded-lg hover:bg-primary/5 transition-all">
                          {coupon.active ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => deleteCoupon(coupon.id)} className="text-xs font-outfit font-bold text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition-all">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
