import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Green Gold Connect",
  description:
    "Tek satır kod ile her checkout sayfasına karbon nötrlük katkı widget'ı.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
