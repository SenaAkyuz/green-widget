import Link from "next/link";

// Landing ve demo sayfalarının paylaştığı üst bar. Admin Dashboard butonu
// 320–479px'de "Admin" olarak kısalır (erişilebilir ad "Admin Dashboard" kalır).
export function SiteHeader({ variant }: { variant: "landing" | "demo" }) {
  const logo = (
    <span className="font-extrabold text-sm sm:text-base whitespace-nowrap">
      🌿 Green Gold <span className="text-primary">Connect</span>
    </span>
  );

  return (
    <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 max-w-6xl mx-auto w-full min-w-0">
        {variant === "demo" ? (
          <Link href="/" className="min-w-0 shrink truncate">
            {logo}
          </Link>
        ) : (
          <div className="min-w-0 shrink truncate">{logo}</div>
        )}
        <nav className="flex items-center gap-1 text-sm shrink-0">
          {variant === "landing" ? (
            <Link
              href="/demo"
              className="flex items-center justify-center min-h-11 px-2.5 sm:px-3 py-2 rounded-lg text-muted hover:text-text hover:bg-surface"
            >
              Demo
            </Link>
          ) : (
            <Link
              href="/"
              className="flex items-center justify-center min-h-11 px-2.5 sm:px-3 py-2 rounded-lg text-muted hover:text-text hover:bg-surface"
            >
              Ana sayfa
            </Link>
          )}
          <Link
            href="/admin"
            aria-label="Admin Dashboard"
            className="flex items-center justify-center min-h-11 px-3 sm:px-3.5 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-[#256530] whitespace-nowrap"
          >
            <span className="sm:hidden">Admin</span>
            <span className="hidden sm:inline">Admin Dashboard</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
