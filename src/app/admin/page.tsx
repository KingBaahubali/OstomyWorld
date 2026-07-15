"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, doc, updateDoc, orderBy, query,
  addDoc, deleteDoc, serverTimestamp, setDoc, getDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const ADMIN_EMAIL = "ostomyworld.in@gmail.com";

// ─── Types ────────────────────────────────────────────────────────────────────
type Order = {
  id: string; userEmail: string; userId: string; totalAmount: number;
  status: string; paymentMethod: string; paymentStatus?: string;
  razorpayPaymentId?: string;
  shippingAddress: { fullName: string; phone: string; address: string; city: string; state: string; pincode: string; };
  items: { name: string; size: string; quantity: number; price: number }[];
  createdAt: any;
};
type Customer = {
  userId: string; email: string; name: string; phone: string;
  city: string; state: string; orderCount: number; totalSpent: number;
  lastOrder: any; firstOrder: any; orders: Order[]; notes?: string;
  segment: "new" | "returning" | "vip"; blacklisted?: boolean;
};
type Coupon = {
  id: string; code: string; discountType: "percent" | "flat";
  discountValue: number; active: boolean; usageCount?: number;
  expiresAt?: string;
};
type Screen = "dashboard" | "orders" | "customers" | "analytics" | "marketing" | "inventory" | "settings";

const ORDER_STATUSES = ["processing", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  processing: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800", delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};
const PIE_COLORS = ["#3a9c3a", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

function getSegment(orderCount: number, totalSpent: number): Customer["segment"] {
  if (totalSpent >= 10000) return "vip";
  if (orderCount >= 2) return "returning";
  return "new";
}
const SEGMENT_BADGE: Record<string, string> = {
  new: "bg-blue-100 text-blue-700", returning: "bg-yellow-100 text-yellow-700", vip: "bg-purple-100 text-purple-700",
};
const SEGMENT_LABEL: Record<string, string> = { new: "🆕 New", returning: "🔁 Returning", vip: "👑 VIP" };

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportOrdersToCSV(orders: Order[]) {
  const headers = ["Order ID", "Date", "Customer", "Email", "Phone", "Address", "City", "State", "Pincode", "Items", "Amount", "Payment", "Status"];
  const rows = orders.map(o => [
    o.id, o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString("en-IN") : "",
    o.shippingAddress?.fullName, o.userEmail, o.shippingAddress?.phone,
    o.shippingAddress?.address, o.shippingAddress?.city, o.shippingAddress?.state,
    o.shippingAddress?.pincode,
    o.items?.map(i => `${i.name}(${i.size})x${i.quantity}`).join("; "),
    o.totalAmount, o.paymentMethod, o.status,
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ""}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `orders_${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Admin PIN (set NEXT_PUBLIC_ADMIN_PIN in .env.local) ─────────────────────
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "Krishn@99";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCRM() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState({ storeName: "Ostomy World", phone: "", email: "ostomyworld.in@gmail.com", address: "Hyderabad, Telangana" });
  const [loadingData, setLoadingData] = useState(true);

  // PIN gate
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("admin_unlocked") === "true") {
      setPinUnlocked(true);
    }
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      sessionStorage.setItem("admin_unlocked", "true");
      setPinUnlocked(true);
      setPinError("");
    } else {
      setPinError("Incorrect password. Try again.");
      setPinInput("");
    }
  };

  // Orders state
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSegmentFilter, setCustomerSegmentFilter] = useState("all");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"percent" | "flat">("percent");
  const [couponValue, setCouponValue] = useState("");
  const [couponExpiry, setCouponExpiry] = useState("");
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Settings state
  const [savingSettings, setSavingSettings] = useState(false);

  // Inventory state
  const [inventory, setInventory] = useState<{ S: number; M: number; L: number }>({ S: 0, M: 0, L: 0 });
  const [savingInventory, setSavingInventory] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login?redirect=/admin");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!pinUnlocked || !user) return;
    (async () => {
      setLoadingData(true);
      try {
        const [ordersSnap, couponsSnap, settingsDoc, inventoryDoc] = await Promise.all([
          getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"))),
          getDocs(collection(db, "coupons")),
          getDoc(doc(db, "admin", "settings")),
          getDoc(doc(db, "inventory", "ostobelt")),
        ]);

        const fetchedOrders: Order[] = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        setOrders(fetchedOrders);
        setCoupons(couponsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon)));
        if (settingsDoc.exists()) setSettings(s => ({ ...s, ...settingsDoc.data() }));
        if (inventoryDoc.exists()) {
          const invData = inventoryDoc.data();
          setInventory({
            S: invData.stock_S ?? 0,
            M: invData.stock_M ?? 0,
            L: invData.stock_L ?? 0,
          });
        }

        // Build customer profiles
        const map: Record<string, Customer> = {};
        fetchedOrders.forEach(order => {
          const key = order.userId || order.userEmail;
          if (!map[key]) {
            map[key] = {
              userId: order.userId, email: order.userEmail,
              name: order.shippingAddress?.fullName || "—",
              phone: order.shippingAddress?.phone || "—",
              city: order.shippingAddress?.city || "—",
              state: order.shippingAddress?.state || "—",
              orderCount: 0, totalSpent: 0,
              lastOrder: order.createdAt, firstOrder: order.createdAt,
              orders: [], segment: "new",
            };
          }
          map[key].orderCount++;
          map[key].totalSpent += order.totalAmount || 0;
          map[key].orders.push(order);
          if (order.createdAt?.seconds < map[key].firstOrder?.seconds) map[key].firstOrder = order.createdAt;
        });

        // Fetch customer notes
        const customerDocs = await getDocs(collection(db, "customers"));
        customerDocs.forEach(d => {
          const key = d.id;
          if (map[key]) { map[key].notes = d.data().notes; map[key].blacklisted = d.data().blacklisted; }
        });

        setCustomers(Object.values(map).map(c => ({ ...c, segment: getSegment(c.orderCount, c.totalSpent) })));
      } catch (e) { console.error(e); }
      finally { setLoadingData(false); }
    })();
  }, [pinUnlocked, user]);

  // ── Revenue Data ─────────────────────────────────────────────────────────
  const revenueByDay = useMemo(() => {
    const map: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      map[d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })] = 0;
    }
    orders.forEach(o => {
      if (!o.createdAt?.toDate) return;
      const d = o.createdAt.toDate();
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 30) {
        const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        if (key in map) map[key] += o.totalAmount || 0;
      }
    });
    return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
  }, [orders]);

  const revenueByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      if (!o.createdAt?.toDate) return;
      const d = o.createdAt.toDate();
      const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      map[key] = (map[key] || 0) + (o.totalAmount || 0);
    });
    return Object.entries(map).slice(-6).map(([month, revenue]) => ({ month, revenue }));
  }, [orders]);

  const paymentSplit = useMemo(() => {
    const cod = orders.filter(o => o.paymentMethod === "cod").length;
    const online = orders.filter(o => o.paymentMethod === "online").length;
    return [{ name: "Cash on Delivery", value: cod }, { name: "Online (Razorpay)", value: online }];
  }, [orders]);

  const cityBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => { const c = o.shippingAddress?.city; if (c) map[c] = (map[c] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([city, count]) => ({ city, count }));
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [orders]);

  // ── Filtered Orders ───────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => orders.filter(o => {
    const matchSearch = !orderSearch || o.userEmail?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.shippingAddress?.phone?.includes(orderSearch);
    const matchStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
    const matchPayment = orderPaymentFilter === "all" || o.paymentMethod === orderPaymentFilter;
    return matchSearch && matchStatus && matchPayment;
  }), [orders, orderSearch, orderStatusFilter, orderPaymentFilter]);

  // ── Filtered Customers ────────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => customers.filter(c => {
    const matchSearch = !customerSearch || c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch);
    const matchSegment = customerSegmentFilter === "all" || c.segment === customerSegmentFilter;
    return matchSearch && matchSegment;
  }), [customers, customerSearch, customerSegmentFilter]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch { alert("Failed to update."); } finally { setUpdatingOrder(null); }
  };

  const bulkUpdateStatus = async (status: string) => {
    const ids = Array.from(selectedOrders);
    await Promise.all(ids.map(id => updateDoc(doc(db, "orders", id), { status })));
    setOrders(prev => prev.map(o => selectedOrders.has(o.id) ? { ...o, status } : o));
    setSelectedOrders(new Set());
  };

  const saveCustomerNote = async () => {
    if (!selectedCustomer) return;
    setSavingNote(true);
    const key = selectedCustomer.userId || selectedCustomer.email;
    try {
      await setDoc(doc(db, "customers", key), { notes: noteText, email: selectedCustomer.email }, { merge: true });
      setCustomers(prev => prev.map(c => (c.userId === selectedCustomer.userId ? { ...c, notes: noteText } : c)));
      setSelectedCustomer(prev => prev ? { ...prev, notes: noteText } : null);
    } catch { alert("Failed to save note."); } finally { setSavingNote(false); }
  };

  const toggleBlacklist = async (customer: Customer) => {
    const key = customer.userId || customer.email;
    const newVal = !customer.blacklisted;
    await setDoc(doc(db, "customers", key), { blacklisted: newVal, email: customer.email }, { merge: true });
    setCustomers(prev => prev.map(c => (c.userId === customer.userId ? { ...c, blacklisted: newVal } : c)));
    if (selectedCustomer?.userId === customer.userId) setSelectedCustomer(prev => prev ? { ...prev, blacklisted: newVal } : null);
  };

  const createCoupon = async () => {
    if (!couponCode || !couponValue) return;
    setSavingCoupon(true);
    try {
      const data: any = { code: couponCode.trim().toUpperCase(), discountType: couponType, discountValue: Number(couponValue), active: true, usageCount: 0, createdAt: serverTimestamp() };
      if (couponExpiry) data.expiresAt = couponExpiry;
      const ref = await addDoc(collection(db, "coupons"), data);
      setCoupons(prev => [...prev, { id: ref.id, ...data }]);
      setCouponCode(""); setCouponValue(""); setCouponExpiry("");
    } catch { alert("Failed."); } finally { setSavingCoupon(false); }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    await updateDoc(doc(db, "coupons", coupon.id), { active: !coupon.active });
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c));
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await deleteDoc(doc(db, "coupons", id));
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try { await setDoc(doc(db, "admin", "settings"), settings); alert("Settings saved!"); }
    catch { alert("Failed to save."); } finally { setSavingSettings(false); }
  };

  const saveInventory = async () => {
    setSavingInventory(true);
    try {
      await setDoc(doc(db, "inventory", "ostobelt"), {
        stock_S: inventory.S,
        stock_M: inventory.M,
        stock_L: inventory.L,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      alert("Inventory saved!");
    } catch {
      alert("Failed to save inventory.");
    } finally {
      setSavingInventory(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalRevenue = orders.filter(o => o.paymentStatus === "paid").reduce((s, o) => s + o.totalAmount, 0);
  const todayOrders = orders.filter(o => { if (!o.createdAt?.toDate) return false; const d = o.createdAt.toDate(), t = new Date(); return d.toDateString() === t.toDateString(); }).length;
  const avgOrderValue = orders.length ? Math.round(orders.reduce((s, o) => s + o.totalAmount, 0) / orders.length) : 0;
  const pendingOrders = orders.filter(o => o.status === "processing" || o.status === "confirmed").length;

  if (authLoading || !user) return <div className="min-h-screen w-full bg-[#0f1117] flex items-center justify-center font-outfit text-gray-400">Loading...</div>;

  // PIN Gate — shown to any logged-in user who hasn't unlocked yet
  if (!pinUnlocked) {
    return (
      <div className="min-h-screen w-full bg-[#0f1117] flex items-center justify-center px-6">
        <div className="bg-[#1a1d27] rounded-2xl p-8 w-[400px] max-w-full border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary mx-auto flex items-center justify-center font-bold text-white text-lg mb-4">OW</div>
            <h1 className="font-outfit font-bold text-white text-2xl">Admin Access</h1>
            <p className="text-gray-400 text-sm font-public mt-2">Enter your admin password to continue</p>
          </div>
          {pinError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-public text-center">{pinError}</div>
          )}
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="Admin password"
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white font-public text-sm focus:outline-none focus:border-primary placeholder:text-gray-600"
              />
              <button type="button" onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showPin ? "🙈" : "👁"}
              </button>
            </div>
            <button type="submit"
              className="w-full bg-primary text-white font-outfit font-bold py-3 rounded-xl hover:opacity-90 transition-all">
              Unlock Dashboard
            </button>
          </form>
          <p className="text-center text-xs text-gray-600 font-public mt-6">Signed in as {user.email}</p>
          <button onClick={() => { logout(); router.push("/login?redirect=/admin"); }}
            className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors mt-2">
            Sign in with a different account →
          </button>
        </div>
      </div>
    );
  }

  // ── Sidebar items ─────────────────────────────────────────────────────────
  const navItems: { id: Screen; label: string; icon: string; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "orders", label: "Orders", icon: "📦", badge: pendingOrders || undefined },
    { id: "customers", label: "Customers", icon: "👥", badge: customers.length || undefined },
    { id: "inventory", label: "Inventory", icon: "📦" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "marketing", label: "Marketing", icon: "🏷️" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-[#f8f9fc] font-outfit">

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#1a1d27] text-white transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static w-64 flex-shrink-0`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-sm">OW</div>
            <div>
              <div className="font-bold text-sm text-white leading-none">Ostomy World</div>
              <div className="text-xs text-gray-400 mt-0.5">CRM Dashboard</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setScreen(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${screen === item.id ? "bg-primary text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
              <span className="text-base">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge ? <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${screen === item.id ? "bg-white/20 text-white" : "bg-primary/20 text-primary"}`}>{item.badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-primary font-bold text-xs">{user.email?.[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-bold truncate">{user.email}</div>
              <div className="text-xs text-gray-500">Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="font-bold text-gray-900 text-lg capitalize">{screen}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-400 font-public">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">

          {/* ══════════════ DASHBOARD ══════════════ */}
          {screen === "dashboard" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, sub: "Online payments", color: "text-green-600", bg: "bg-green-50" },
                  { label: "Total Orders", value: orders.length, sub: `${todayOrders} today`, color: "text-primary", bg: "bg-primary/5" },
                  { label: "Avg. Order Value", value: `₹${avgOrderValue.toLocaleString("en-IN")}`, sub: "Per order", color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Pending Action", value: pendingOrders, sub: "Need shipping", color: "text-orange-500", bg: "bg-orange-50" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className={`text-xs font-bold font-public uppercase tracking-wider mb-3 px-2 py-1 rounded-lg w-fit ${s.bg} ${s.color}`}>{s.label}</div>
                    <div className={`font-bold text-3xl ${s.color} mb-1`}>{s.value}</div>
                    <div className="font-public text-xs text-gray-400">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Revenue Chart */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-gray-800 text-lg">Revenue — Last 30 Days</h2>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueByDay} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} interval={4} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `₹${v}`} />
                    <Tooltip formatter={(v: any) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }} />
                    <Bar dataKey="revenue" fill="#3a9c3a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Orders + Customers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Recent Orders</h3>
                    <button onClick={() => setScreen("orders")} className="text-xs text-primary font-bold hover:underline">View All →</button>
                  </div>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map(o => (
                      <div key={o.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-gray-800 truncate">{o.shippingAddress?.fullName || o.userEmail}</div>
                          <div className="text-xs text-gray-400 font-public">#{o.id.slice(-6).toUpperCase()}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}>{o.status}</span>
                          <span className="font-bold text-sm text-primary">₹{o.totalAmount?.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && <p className="text-gray-400 text-sm font-public text-center py-4">No orders yet.</p>}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Customer Segments</h3>
                    <button onClick={() => setScreen("customers")} className="text-xs text-primary font-bold hover:underline">View All →</button>
                  </div>
                  <div className="space-y-3">
                    {(["new", "returning", "vip"] as const).map(seg => {
                      const count = customers.filter(c => c.segment === seg).length;
                      return (
                        <div key={seg} className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full w-24 text-center ${SEGMENT_BADGE[seg]}`}>{SEGMENT_LABEL[seg]}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: customers.length ? `${(count / customers.length) * 100}%` : "0%" }} />
                          </div>
                          <span className="text-sm font-bold text-gray-700 w-6 text-right">{count}</span>
                        </div>
                      );
                    })}
                    {customers.length === 0 && <p className="text-gray-400 text-sm font-public text-center py-4">No customers yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ ORDERS ══════════════ */}
          {screen === "orders" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
                <input placeholder="Search name, email, phone, order ID..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-public focus:outline-none focus:border-primary flex-1 min-w-48" />
                <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-public focus:outline-none focus:border-primary bg-white">
                  <option value="all">All Statuses</option>
                  {ORDER_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
                <select value={orderPaymentFilter} onChange={e => setOrderPaymentFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-public focus:outline-none focus:border-primary bg-white">
                  <option value="all">All Payments</option>
                  <option value="cod">COD</option>
                  <option value="online">Online</option>
                </select>
                <button onClick={() => exportOrdersToCSV(filteredOrders)}
                  className="bg-gray-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-700 transition-all flex items-center gap-2">
                  ↓ Export CSV
                </button>
              </div>

              {/* Bulk Actions */}
              {selectedOrders.size > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                  <span className="font-bold text-primary text-sm">{selectedOrders.size} selected</span>
                  <span className="text-gray-400 text-xs">Bulk update to:</span>
                  {ORDER_STATUSES.map(s => (
                    <button key={s} onClick={() => bulkUpdateStatus(s)}
                      className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-all capitalize">{s}</button>
                  ))}
                  <button onClick={() => setSelectedOrders(new Set())} className="ml-auto text-xs text-gray-400 hover:text-gray-700">Clear</button>
                </div>
              )}

              {/* Orders list */}
              <div className="space-y-2">
                {loadingData ? <div className="text-center py-16 text-gray-400 font-public">Loading orders...</div>
                  : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                      <p className="font-bold text-xl text-gray-300">{orderSearch ? "No results" : "No orders yet"}</p>
                    </div>
                  ) : filteredOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 p-5">
                        <input type="checkbox" checked={selectedOrders.has(order.id)}
                          onChange={e => setSelectedOrders(prev => { const s = new Set(prev); e.target.checked ? s.add(order.id) : s.delete(order.id); return s; })}
                          className="w-4 h-4 accent-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm">#{order.id.slice(-8).toUpperCase()}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>{order.status}</span>
                            <span className="text-xs text-gray-400">{order.paymentMethod === "online" ? "💳 Online" : "💰 COD"}</span>
                            {order.shippingAddress?.fullName && <span className="text-xs text-gray-500 font-public">{order.shippingAddress.fullName}</span>}
                          </div>
                          <div className="text-xs text-gray-400 font-public mt-0.5">{order.userEmail}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-primary">₹{order.totalAmount?.toLocaleString("en-IN")}</div>
                          <div className="text-xs text-gray-400 font-public">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</div>
                        </div>
                        <div className="text-gray-300 cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>{expandedOrder === order.id ? "▲" : "▼"}</div>
                      </div>
                      {expandedOrder === order.id && (
                        <div className="border-t border-gray-100 p-5 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-bold text-gray-700 text-sm mb-2">📦 Ship To</h4>
                            <div className="font-public text-sm text-gray-600 space-y-0.5">
                              <p className="font-bold text-gray-800">{order.shippingAddress?.fullName}</p>
                              <p>+91 {order.shippingAddress?.phone}</p>
                              <p>{order.shippingAddress?.address}</p>
                              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-700 text-sm mb-2">🛒 Items</h4>
                            {order.items?.map((item, i) => (
                              <div key={i} className="flex justify-between font-public text-sm text-gray-600">
                                <span>{item.name} ({item.size}) × {item.quantity}</span>
                                <span className="font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                              </div>
                            ))}
                            {order.razorpayPaymentId && <p className="text-xs text-gray-400 mt-2 font-mono">Pay ID: {order.razorpayPaymentId}</p>}
                          </div>
                          <div className="md:col-span-2">
                            <h4 className="font-bold text-gray-700 text-sm mb-2">🔄 Update Status</h4>
                            <div className="flex flex-wrap gap-2">
                              {ORDER_STATUSES.map(s => (
                                <button key={s} disabled={updatingOrder === order.id || order.status === s} onClick={() => updateOrderStatus(order.id, s)}
                                  className={`px-4 py-2 rounded-xl font-bold text-xs capitalize transition-all ${order.status === s ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"}`}>
                                  {updatingOrder === order.id && order.status !== s ? "..." : s}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ══════════════ CUSTOMERS ══════════════ */}
          {screen === "customers" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Customer list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <input placeholder="Search customers..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-public focus:outline-none focus:border-primary flex-1 min-w-48 bg-white" />
                  <select value={customerSegmentFilter} onChange={e => setCustomerSegmentFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-public focus:outline-none focus:border-primary bg-white">
                    <option value="all">All Segments</option>
                    <option value="new">🆕 New</option>
                    <option value="returning">🔁 Returning</option>
                    <option value="vip">👑 VIP</option>
                  </select>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {loadingData ? <div className="text-center py-16 text-gray-400 font-public">Loading...</div>
                    : filteredCustomers.length === 0 ? <div className="text-center py-16 text-gray-300 font-bold text-xl">No customers found</div>
                    : filteredCustomers.map((c, i) => (
                      <div key={i} onClick={() => { setSelectedCustomer(c); setNoteText(c.notes || ""); }}
                        className={`flex items-center gap-4 p-4 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${selectedCustomer?.userId === c.userId ? "bg-primary/5" : ""}`}>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                          {c.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-800 text-sm">{c.name}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SEGMENT_BADGE[c.segment]}`}>{SEGMENT_LABEL[c.segment]}</span>
                            {c.blacklisted && <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">🚫 Blacklisted</span>}
                          </div>
                          <div className="text-xs text-gray-400 font-public truncate">{c.email} · {c.city}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-sm text-primary">₹{c.totalSpent.toLocaleString("en-IN")}</div>
                          <div className="text-xs text-gray-400">{c.orderCount} order{c.orderCount !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Customer Profile Panel */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit sticky top-24">
                {!selectedCustomer ? (
                  <div className="text-center py-12 text-gray-300">
                    <div className="text-4xl mb-3">👤</div>
                    <p className="font-bold">Select a customer</p>
                    <p className="text-sm font-public mt-1">Click any customer to view their profile</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">{selectedCustomer.name?.[0]?.toUpperCase()}</div>
                      <div>
                        <h3 className="font-bold text-gray-800">{selectedCustomer.name}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SEGMENT_BADGE[selectedCustomer.segment]}`}>{SEGMENT_LABEL[selectedCustomer.segment]}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm font-public text-gray-600">
                      <p>📧 {selectedCustomer.email}</p>
                      <p>📱 +91 {selectedCustomer.phone}</p>
                      <p>📍 {selectedCustomer.city}, {selectedCustomer.state}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="font-bold text-primary text-xl">{selectedCustomer.orderCount}</div>
                        <div className="text-xs text-gray-500">Orders</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="font-bold text-green-600 text-xl">₹{selectedCustomer.totalSpent.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-gray-500">Lifetime Value</div>
                      </div>
                    </div>
                    {/* Order History */}
                    <div>
                      <h4 className="font-bold text-gray-700 text-sm mb-2">Order History</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {selectedCustomer.orders.map(o => (
                          <div key={o.id} className="flex justify-between text-xs font-public py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">#{o.id.slice(-6).toUpperCase()} · <span className={`font-bold capitalize ${o.status === "delivered" ? "text-green-600" : o.status === "cancelled" ? "text-red-500" : "text-blue-500"}`}>{o.status}</span></span>
                            <span className="font-bold text-gray-700">₹{o.totalAmount?.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Admin Notes */}
                    <div>
                      <h4 className="font-bold text-gray-700 text-sm mb-2">Admin Notes</h4>
                      <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} placeholder="Private notes about this customer..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-public focus:outline-none focus:border-primary resize-none" />
                      <button onClick={saveCustomerNote} disabled={savingNote}
                        className="mt-2 w-full bg-primary text-white font-bold text-sm py-2 rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
                        {savingNote ? "Saving..." : "Save Note"}
                      </button>
                    </div>
                    {/* Blacklist */}
                    <button onClick={() => toggleBlacklist(selectedCustomer)}
                      className={`w-full font-bold text-sm py-2 rounded-xl border transition-all ${selectedCustomer.blacklisted ? "border-green-400 text-green-600 hover:bg-green-50" : "border-red-300 text-red-500 hover:bg-red-50"}`}>
                      {selectedCustomer.blacklisted ? "✅ Remove from Blacklist" : "🚫 Blacklist Customer"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════ ANALYTICS ══════════════ */}
          {screen === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Revenue */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h2 className="font-bold text-gray-800 mb-5">Monthly Revenue</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={revenueByMonth} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `₹${v}`} />
                      <Tooltip formatter={(v: any) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} />
                      <Bar dataKey="revenue" fill="#3a9c3a" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Payment Split */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h2 className="font-bold text-gray-800 mb-5">Payment Method Split</h2>
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="60%" height={220}>
                      <PieChart>
                        <Pie data={paymentSplit} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                          {paymentSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => [v, "Orders"]} contentStyle={{ borderRadius: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {paymentSplit.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                          <div>
                            <div className="font-bold text-gray-700 text-sm">{p.value}</div>
                            <div className="text-xs text-gray-400 font-public">{p.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* City Breakdown */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h2 className="font-bold text-gray-800 mb-5">Orders by City</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={cityBreakdown} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis dataKey="city" type="category" tick={{ fontSize: 11, fill: "#9ca3af" }} width={80} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Order Status Funnel */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h2 className="font-bold text-gray-800 mb-5">Order Status Breakdown</h2>
                  <div className="space-y-4">
                    {statusBreakdown.map((s, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-bold text-gray-700 capitalize">{s.status}</span>
                          <span className="text-sm font-bold text-gray-500">{s.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(s.count / orders.length) * 100}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && <p className="text-center py-8 text-gray-300 font-bold">No data yet</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ MARKETING ══════════════ */}
          {screen === "marketing" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-xl text-gray-800 mb-5">Create Discount Coupon</h2>
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="block font-public font-bold text-xs text-gray-600 mb-1">Coupon Code</label>
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="WELCOME20"
                      className="border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-sm focus:outline-none focus:border-primary w-44 uppercase" />
                  </div>
                  <div>
                    <label className="block font-public font-bold text-xs text-gray-600 mb-1">Type</label>
                    <select value={couponType} onChange={e => setCouponType(e.target.value as any)}
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary bg-white">
                      <option value="percent">% Discount</option>
                      <option value="flat">₹ Flat Off</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-public font-bold text-xs text-gray-600 mb-1">Value</label>
                    <input value={couponValue} onChange={e => setCouponValue(e.target.value)} type="number" min="1" placeholder={couponType === "percent" ? "20" : "200"}
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary w-28 font-public" />
                  </div>
                  <div>
                    <label className="block font-public font-bold text-xs text-gray-600 mb-1">Expires On (optional)</label>
                    <input value={couponExpiry} onChange={e => setCouponExpiry(e.target.value)} type="date" min={new Date().toISOString().split("T")[0]}
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-public bg-white" />
                  </div>
                  <button onClick={createCoupon} disabled={savingCoupon || !couponCode || !couponValue}
                    className="bg-primary text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
                    {savingCoupon ? "Creating..." : "Create Coupon"}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-bold text-lg text-gray-800">All Coupons</h3>
                </div>
                {coupons.length === 0 ? <p className="text-center py-16 text-gray-300 font-bold text-xl">No coupons yet</p>
                  : <div className="divide-y divide-gray-50">
                    {coupons.map(coupon => (
                      <div key={coupon.id} className="flex items-center gap-4 p-5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-bold text-gray-800 tracking-widest bg-gray-100 px-3 py-1 rounded-lg text-sm">{coupon.code}</span>
                            <span className="font-public text-sm text-gray-600">{coupon.discountType === "percent" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}</span>
                            {coupon.expiresAt && <span className="text-xs text-gray-400 font-public">Expires {new Date(coupon.expiresAt).toLocaleDateString("en-IN")}</span>}
                            {typeof coupon.usageCount === "number" && <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">{coupon.usageCount} uses</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${coupon.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{coupon.active ? "Active" : "Inactive"}</span>
                          <button onClick={() => toggleCoupon(coupon)} className="text-xs font-bold text-primary border border-primary/30 px-3 py-1 rounded-lg hover:bg-primary/5 transition-all">{coupon.active ? "Deactivate" : "Activate"}</button>
                          <button onClick={() => deleteCoupon(coupon.id)} className="text-xs font-bold text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition-all">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>}
              </div>
            </div>
          )}

        {/* ── INVENTORY TAB ── */}
        {screen === "inventory" && (
          <div className="max-w-3xl space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Inventory Management</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-xl">📦</span> OstoBelt Stock Levels
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Size S (28"-32")</label>
                  <input 
                    type="number" min="0" 
                    value={inventory.S} 
                    onChange={e => setInventory(p => ({ ...p, S: Number(e.target.value) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-public focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Size M (33"-37")</label>
                  <input 
                    type="number" min="0" 
                    value={inventory.M} 
                    onChange={e => setInventory(p => ({ ...p, M: Number(e.target.value) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-public focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Size L (38"-42")</label>
                  <input 
                    type="number" min="0" 
                    value={inventory.L} 
                    onChange={e => setInventory(p => ({ ...p, L: Number(e.target.value) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-public focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={saveInventory}
                  disabled={savingInventory}
                  className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {savingInventory ? "Saving..." : "Update Stock"}
                </button>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-bold text-blue-900 mb-1">How Inventory Works</h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  When a customer purchases a belt, the stock will automatically decrement here. 
                  If a size reaches 0, the button on the storefront will become grayed out and say "Out of Stock", preventing further purchases.
                </p>
              </div>
            </div>
          </div>
        )}


          {/* ══════════════ SETTINGS ══════════════ */}
          {screen === "settings" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-xl text-gray-800 mb-6">Store Settings</h2>
                <div className="space-y-4">
                  {[
                    { key: "storeName", label: "Store Name" },
                    { key: "email", label: "Support Email" },
                    { key: "phone", label: "Support Phone" },
                    { key: "address", label: "Business Address" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block font-bold text-sm text-gray-700 mb-1">{f.label}</label>
                      <input value={(settings as any)[f.key]} onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-public focus:outline-none focus:border-primary" />
                    </div>
                  ))}
                  <button onClick={saveSettings} disabled={savingSettings}
                    className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
                    {savingSettings ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4">Quick Links</h3>
                <div className="space-y-2">
                  {[
                    { label: "Firebase Console", url: "https://console.firebase.google.com" },
                    { label: "Razorpay Dashboard", url: "https://dashboard.razorpay.com" },
                    { label: "Shiprocket Panel", url: "https://app.shiprocket.in" },
                    { label: "Vercel Deployments", url: "https://vercel.com/dashboard" },
                    { label: "GitHub Repository", url: "https://github.com/KingBaahubali/OstomyWorld" },
                  ].map(link => (
                    <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                      <span className="font-bold text-sm text-gray-700">{link.label}</span>
                      <span className="text-gray-300 group-hover:text-primary transition-colors">→</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
