import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ChatPanel } from "@/components/ChatPanel";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Foxie Casino | Luck Favors the Bold",
  description: "The most exciting casino on Monad blockchain. Play Coin Flip, Mines, Roulette, and Upgrader with provably fair games.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#0d1117]`}>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            {/* Left Sidebar */}
            <Sidebar />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
            
            {/* Right Chat Panel */}
            <ChatPanel />
          </div>
        </Providers>
      </body>
    </html>
  );
}
