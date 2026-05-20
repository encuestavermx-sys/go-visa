"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "../../lib/dbService";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthChange((user) => {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "admin") {
        // Not an admin, redirect to normal dashboard
        router.push("/dashboard");
      } else {
        setCurrentAdmin(user);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await authService.logout();
    if (typeof window !== "undefined") {
      localStorage.removeItem("go-visa_session");
    }
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center text-[#0b1c30]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-slate-600">Cargando panel de administración...</span>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: "Clientes y Solicitudes", path: "/admin", icon: "group" },
    { name: "Tiempos de Espera", path: "/admin/wait-times", icon: "schedule" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex relative">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[280px] bg-white text-slate-800 flex-col justify-between py-6 px-4 flex-shrink-0 relative z-20 border-r border-slate-200">
        <div>
          <div className="px-4 mb-10 flex items-center gap-2">
            <Link href="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="Go-Visa Logo" className="h-8 w-auto object-contain" />
              <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-semibold px-2 py-0.5 rounded-full uppercase">Admin</span>
            </Link>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-500 hover:text-slate-850 hover:bg-slate-55"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-primary" : "text-slate-400"}`}>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer profile area */}
        <div className="border-t border-slate-100 pt-4 mt-auto">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              AD
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate">{currentAdmin?.displayName}</span>
              <span className="text-[10px] text-slate-400 truncate">{currentAdmin?.email}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-650 hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar - Mobile drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-[270px] bg-white text-slate-850 flex flex-col justify-between py-6 px-4 z-50 transition-transform duration-300 md:hidden border-r border-slate-200 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-4 mb-10">
            <Link href="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="Go-Visa Logo" className="h-8 w-auto object-contain" />
              <span className="text-[10px] bg-slate-100 text-slate-650 border border-slate-200 font-semibold px-2 py-0.5 rounded-full uppercase">Admin</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-full hover:bg-slate-105 text-slate-500"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-55"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-primary" : "text-slate-400"}`}>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer profile area mobile */}
        <div className="border-t border-slate-100 pt-4 mt-auto">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              AD
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-850 truncate">{currentAdmin?.displayName}</span>
              <span className="text-[10px] text-slate-400 truncate">{currentAdmin?.email}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-650 hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 md:hidden z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 rounded hover:bg-slate-100 text-[#0b1c30]"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <img src="/logo.png" alt="Go-Visa Logo" className="h-7 w-auto object-contain" />
            <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 border border-slate-200 rounded uppercase">Admin</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            AD
          </div>
        </header>

        {/* Page Content wrapper */}
        <main className="flex-1 overflow-y-auto bg-[#f8f9ff] relative">
          {children}
        </main>
      </div>
    </div>
  );
}
