"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { NAV, isNavActive } from "./nav";
import { DemoToggle } from "./DemoToggle";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// < md: sabit sidebar yerine kompakt üst bar + erişilebilir drawer.
export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Body scroll lock while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape kapatır; odak drawer'a girer ve kapanınca tetikleyici butona döner.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "Tab" && panel) {
        const focusable = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusable.length === 0) return;
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      toggleRef.current?.focus();
    };
  }, [open]);

  return (
    <div className="md:hidden">
      {/* Kompakt mobil admin bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-surface border-b border-border px-4 py-3">
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="admin-mobile-drawer"
          aria-label="Menüyü aç"
          className="flex items-center justify-center w-11 h-11 -ml-1.5 rounded-lg text-text hover:bg-bg"
        >
          <span aria-hidden="true" className="text-xl leading-none">☰</span>
        </button>
        <Link href="/" className="font-extrabold text-sm text-text leading-tight truncate">
          🌿 Green Gold <span className="text-primary">Connect</span>
        </Link>
        <span className="w-11 h-11" aria-hidden="true" />
      </div>

      {open && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            id="admin-mobile-drawer"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin menüsü"
            className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-surface border-r border-border shadow-xl flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="font-extrabold text-base text-text block leading-tight"
              >
                🌿 Green Gold
                <div className="text-xs font-semibold text-primary mt-0.5">
                  Connect · Admin
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Menüyü kapat"
                className="flex items-center justify-center w-11 h-11 -mr-1.5 rounded-lg text-muted hover:text-text hover:bg-bg text-xl leading-none"
              >
                ×
              </button>
            </div>

            <nav className="flex-1 py-4">
              {NAV.map((item) => {
                const active = isNavActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors min-h-11 ${
                      active
                        ? "bg-primary-soft text-primary font-semibold border-r-2 border-primary"
                        : "text-muted hover:text-text hover:bg-bg"
                    }`}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

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
          </div>
        </div>
      )}
    </div>
  );
}
