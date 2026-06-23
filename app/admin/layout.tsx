"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { DemoToggle } from "./DemoToggle";

const NAV = [
  { href: "/admin", label: "Genel Bakış", icon: "📊" },
  { href: "/admin/partners", label: "Partnerler", icon: "🤝" },
  { href: "/admin/transactions", label: "İşlemler", icon: "💳" },
  { href: "/admin/payouts", label: "Kazanç", icon: "👛" },
  { href: "/admin/integration", label: "Entegrasyon", icon: "🔌" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-bg text-text">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-surface border-r border-border flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <Link href="/" className="font-extrabold text-base text-text block leading-tight">
            🌿 Green Gold
            <div className="text-xs font-semibold text-primary mt-0.5">
              Connect · Admin
            </div>
          </Link>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-primary-soft text-primary font-semibold border-r-2 border-primary"
                    : "text-muted hover:text-text hover:bg-bg"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Demo data toggle */}
        <Suspense fallback={null}>
          <DemoToggle />
        </Suspense>

        <div className="px-5 py-4 border-t border-border">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary-soft px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Test Modu Aktif
          </span>
          <p className="text-[10px] text-muted mt-1.5">Stripe & Supabase bağlı</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
