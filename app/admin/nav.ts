export const NAV = [
  { href: "/admin", label: "Genel Bakış", icon: "📊" },
  { href: "/admin/partners", label: "Partnerler", icon: "🤝" },
  { href: "/admin/transactions", label: "İşlemler", icon: "💳" },
  { href: "/admin/payouts", label: "Kazanç", icon: "👛" },
  { href: "/admin/integration", label: "Entegrasyon", icon: "🔌" },
];

export function isNavActive(href: string, pathname: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}
