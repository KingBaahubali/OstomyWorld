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

const ADMIN_EMAIL = "ostomyworld.in@gmail.com";

type Order = {
  id: string;
  userEmail: string;
  userId: string;
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

type Customer = {
  userId: string;
  email: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: any;
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

type Tab = "orders" | "customers" | "inventory" | "coupons";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Coupon form
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"percent" | "flat">("percent");
  const [couponValue, setCouponValue] = useState("");
  const [savingCoupon, setSavingCoupon] = useState(false);

  const isAdmin = user && user.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && !isAdmin) router.push("/");
  }, [user, authLoading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const ordersSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
        const fetchedOrders: Order[] = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        setOrders(fetchedOrders);

        // Build customers map from orders
        const customerMap: Record<string, Customer> = {};
        fetchedOrders.forEach((order) => {
          const key = order.userId || order.userEmail;
          if (!customerMap[key]) {
            customerMap[key] = {
              userId: order.userId,
              email: order.userEmail,
              name: order.shippingAddress?.fullName || "—",
              phone: order.shippingAddress?.phone || "—",
              city: order.shippingAddress?.city || "—",
              state: order.shippingAddress?.state || "—",
              orderCount: 0,
              totalSpent: 0,
              lastOrder: order.createdAt,
            };
          }
          customerMap[key].orderCount += 1;
          customerMap[key].totalSpent += order.totalAmount || 0;
        });
        setCustomers(Object.values(customerMap));

        const couponsSnap = await getDocs(collection(db, "coupons"));
        setCoupons(couponsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon)));
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
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch { alert("Failed to update status."); }
    finally { setUpdatingOrder(null); }
  };

  const createCoupon = async () => {
    if (!couponCode.trim() || !couponValue) return;
    setSavingCoupon(true);
    try {
      const data = { code: couponCode.trim().toUpperCase(), discountType: couponType, discountValue: Number(couponValue), active: true, createdAt: serverTimestamp() };
      const ref = await addDoc(collection(db, "coupons"), data);
      setCoupons((prev) => [...prev, { id: ref.id, ...data } as Coupon]);
      setCouponCode(""); setCouponValue("");
    } catch { alert("Failed to create coupon."); }
    finally { setSavingCoupon(false); }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    try {
      await updateDoc(doc(db, "coupons", coupon.id), { active: !coupon.active });
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c)));
    } catch { alert("Failed to toggle coupon."); }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await deleteDoc(doc(db, "coupons", id));
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch { alert("Failed to delete coupon."); }
  };

  if (authLoading || !user) return <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center font-outfit text-gray-400">Loading...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center font-outfit text-gray-400">Access denied.</div>;

  const totalRevenue = orders.filter(o => o.paymentStatus === "paid").reduce((s, o) => s + o.totalAmount, 0);
  const codRevenue = orders.filter(o => o.paymentMethod === "cod" && o.status === "delivered").reduce((s, o) => s + o.totalAmount, 0);
  const todayOrders = orders.filter(o => { if (!o.createdAt?.toDate) return false; const d = o.createdAt.toDate(), t = new Date(); return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear(); }).length;

  const filteredOrders = orders.filter(o =>
    o.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.shippingAddress?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm font-outfit">OW</div>
          <div>
            <h1 className="font-outfit font-bold text-gray-900 text-lg leading-none">Admin Dashboard</h1>
            <p className="font-public text-xs text-gray-400">Ostomy World</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            placeholder="Search orders, customers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="hidden sm:block border border-gray-200 rounded-lg px-4 py-2 text-sm font-public focus:outline-none focus:border-primary w-56"
          />
          <span className="font-public text-sm text-gray-400 hidden md:block">{user.email}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Orders", value: orders.length, color: "text-primary" },
            { label: "Today's Orders", value: todayOrders, color: "text-blue-600" },
            { label: "Online Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "text-green-600" },
            { label: "COD Delivered", value: `₹${codRevenue.toLocaleString("en-IN")}`, color: "text-orange-500" },
            { label: "Total Customers", value: customers.length, color: "text-purple-600" },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className={`font-outfit font-bold text-2xl ${stat.color} mb-1`}>{stat.value}</div>
              <div className="font-public text-xs text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 shadow-sm mb-6 w-fit overflow-x-auto">
          {(["orders", "customers", "inventory", "coupons"] as Tab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg font-outfit font-bold text-sm capitalize transition-all whitespace-nowrap ${activeTab === tab ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
              {tab}
              {tab === "orders" && orders.length > 0 && <span className="ml-1.5 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">{orders.length}</span>}
              {tab === "customers" && customers.length > 0 && <span className="ml-1.5 bg-purple-100 text-purple-600 text-xs px-1.5 py-0.5 rounded-full">{customers.length}</span>}
            </button>
          ))}
        </div>

        {/* ── ORDERS TAB ── */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {loadingData ? <div className="text-center py-16 text-gray-400 font-public">Loading orders...</div>
              : filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                  <p className="font-outfit text-xl font-bold text-gray-400">{searchQuery ? "No results found" : "No orders yet"}</p>
                  <p className="font-public text-sm text-gray-400 mt-2">{searchQuery ? "Try a different search." : "Orders appear here when customers buy."}</p>
                </div>
              ) : filteredOrders.map((order) => (
                <motion.div key={order.id} layout className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex flex-wrap items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-outfit font-bold text-gray-900 text-sm">#{order.id.slice(-8).toUpperCase()}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>{order.status}</span>
                        <span className="text-xs text-gray-400 font-public">{order.paymentMethod === "online" ? "💳 Online" : "💰 COD"}</span>
                      </div>
                      <div className="font-public text-sm text-gray-500 mt-0.5">{order.shippingAddress?.fullName} · {order.userEmail}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-outfit font-bold text-primary">₹{order.totalAmount?.toLocaleString("en-IN")}</div>
                      <div className="font-public text-xs text-gray-400">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</div>
                    </div>
                    <div className="text-gray-300">{expandedOrder === order.id ? "▲" : "▼"}</div>
                  </div>

                  {expandedOrder === order.id && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-outfit font-bold text-gray-700 text-sm mb-2">📦 Ship To</h4>
                        <div className="font-public text-sm text-gray-600 space-y-0.5">
                          <p className="font-bold text-gray-800">{order.shippingAddress?.fullName}</p>
                          <p>{order.shippingAddress?.phone}</p>
                          <p>{order.shippingAddress?.address}</p>
                          <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-outfit font-bold text-gray-700 text-sm mb-2">🛒 Items</h4>
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between font-public text-sm text-gray-600">
                            <span>{item.name} ({item.size}) × {item.quantity}</span>
                            <span className="font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                        {order.razorpayPaymentId && <p className="text-xs text-gray-400 mt-2 font-mono">Payment ID: {order.razorpayPaymentId}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="font-outfit font-bold text-gray-700 text-sm mb-2">🔄 Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {ORDER_STATUSES.map((s) => (
                            <button key={s} disabled={updatingOrder === order.id || order.status === s} onClick={() => updateOrderStatus(order.id, s)}
                              className={`px-4 py-2 rounded-lg font-outfit font-bold text-xs capitalize transition-all disabled:opacity-50 ${order.status === s ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"}`}>
                              {updatingOrder === order.id && order.status !== s ? "..." : s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
          </div>
        )}

        {/* ── CUSTOMERS TAB ── */}
        {activeTab === "customers" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-outfit font-bold text-xl text-gray-800">All Customers</h2>
              <p className="font-public text-sm text-gray-400 mt-1">Built from your order history. Every customer who has ever placed an order.</p>
            </div>
            {loadingData ? <div className="text-center py-16 text-gray-400 font-public">Loading customers...</div>
              : filteredCustomers.length === 0 ? <div className="text-center py-16 text-gray-400 font-public">No customers yet.</div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-public">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Customer", "Phone", "Location", "Orders", "Total Spent", "Last Order"].map(h => (
                          <th key={h} className="text-left px-6 py-3 font-outfit font-bold text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredCustomers.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-outfit font-bold text-gray-800">{c.name}</div>
                            <div className="text-gray-400 text-xs">{c.email}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{c.phone}</td>
                          <td className="px-6 py-4 text-gray-600">{c.city}, {c.state}</td>
                          <td className="px-6 py-4">
                            <span className="bg-primary/10 text-primary font-bold text-xs px-2 py-1 rounded-full">{c.orderCount}</span>
                          </td>
                          <td className="px-6 py-4 font-outfit font-bold text-gray-800">₹{c.totalSpent.toLocaleString("en-IN")}</td>
                          <td className="px-6 py-4 text-gray-400 text-xs">
                            {c.lastOrder?.toDate ? c.lastOrder.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* ── INVENTORY TAB ── */}
        {activeTab === "inventory" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-outfit font-bold text-xl text-gray-800 mb-2">Product Inventory</h2>
            <p className="font-public text-sm text-gray-500 mb-6">Current products and pricing.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-public">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Product", "SKU", "Price", "MRP", "Sizes", "Status"].map(h => (
                      <th key={h} className="text-left py-3 font-outfit font-bold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="py-4 font-outfit font-bold text-gray-800">OstoBelt Active Support</td>
                    <td className="py-4 text-gray-500">OSTOBELT-001</td>
                    <td className="py-4 text-primary font-bold">₹2,799</td>
                    <td className="py-4 text-gray-400 line-through">₹3,099</td>
                    <td className="py-4 text-gray-600">S / M / L</td>
                    <td className="py-4"><span className="bg-green-100 text-green-700 font-bold text-xs px-3 py-1 rounded-full">In Stock</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="font-outfit font-bold text-blue-700 text-sm mb-1">💡 To update pricing</p>
              <p className="font-public text-xs text-blue-600">Change the price in <code className="bg-blue-100 px-1 rounded">src/app/shop/ostobelt/page.tsx</code> and also in <code className="bg-blue-100 px-1 rounded">src/app/checkout/page.tsx</code>. Push to GitHub to go live instantly.</p>
            </div>
          </div>
        )}

        {/* ── COUPONS TAB ── */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-outfit font-bold text-xl text-gray-800 mb-5">Create Discount Coupon</h2>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block font-public font-bold text-xs text-gray-600 mb-1">Coupon Code</label>
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME20"
                    className="border border-gray-200 rounded-lg px-4 py-2.5 font-outfit font-bold text-sm focus:outline-none focus:border-primary w-44 uppercase" />
                </div>
                <div>
                  <label className="block font-public font-bold text-xs text-gray-600 mb-1">Type</label>
                  <select value={couponType} onChange={e => setCouponType(e.target.value as "percent" | "flat")} className="border border-gray-200 rounded-lg px-4 py-2.5 font-public text-sm focus:outline-none focus:border-primary">
                    <option value="percent">% Discount</option>
                    <option value="flat">₹ Flat Off</option>
                  </select>
                </div>
                <div>
                  <label className="block font-public font-bold text-xs text-gray-600 mb-1">Value ({couponType === "percent" ? "%" : "₹"})</label>
                  <input value={couponValue} onChange={e => setCouponValue(e.target.value)} type="number" min="1" placeholder={couponType === "percent" ? "20" : "200"}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 font-public text-sm focus:outline-none focus:border-primary w-28" />
                </div>
                <button onClick={createCoupon} disabled={savingCoupon || !couponCode || !couponValue}
                  className="bg-primary text-white font-outfit font-bold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50">
                  {savingCoupon ? "Creating..." : "Create Coupon"}
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-outfit font-bold text-lg text-gray-800 mb-4">All Coupons</h3>
              {coupons.length === 0 ? <p className="font-public text-sm text-gray-400">No coupons yet.</p>
                : <div className="space-y-3">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="flex items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="font-outfit font-bold text-gray-800 tracking-widest text-sm bg-gray-100 px-3 py-1 rounded-lg">{coupon.code}</span>
                        <span className="font-public text-sm text-gray-600">{coupon.discountType === "percent" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${coupon.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{coupon.active ? "Active" : "Inactive"}</span>
                        <button onClick={() => toggleCoupon(coupon)} className="text-xs font-outfit font-bold text-primary border border-primary/30 px-3 py-1 rounded-lg hover:bg-primary/5 transition-all">{coupon.active ? "Deactivate" : "Activate"}</button>
                        <button onClick={() => deleteCoupon(coupon.id)} className="text-xs font-outfit font-bold text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition-all">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
