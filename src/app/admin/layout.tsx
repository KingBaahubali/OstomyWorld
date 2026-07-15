// This layout overrides the root layout for all /admin routes.
// It strips the Navbar, Footer, and the pt-24 padding so the CRM
// can render full-screen without interference.

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
