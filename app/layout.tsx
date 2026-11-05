import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "لقطة | محتوى يليق بعلامتك",
  description: "من الفكرة إلى التسليم. اكتشف المواهب، خطط إعلانك، وتابع كل تفاصيل حملتك في مكان واحد مع لقطة.",
  openGraph: {title:'لقطة | محتوى يليق بعلامتك',description:'حملتك الجاية تبدأ بلقطة.',locale:'ar_PS',type:'website'},
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
