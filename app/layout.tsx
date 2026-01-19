import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// 英語・数字用
const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

// 日本語用
const notojp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crypto Dashboard",
  description: "Solana Analytics Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* ここで変数をbodyに注入することで、Tailwindが認識できるようになります */}
      <body className={`${jakarta.variable} ${notojp.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}