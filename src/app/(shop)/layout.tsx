import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24">{children}</main>
      <Footer />
    </>
  );
}
