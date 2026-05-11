import type { Metadata } from 'next';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatPanel } from '@/components/layout/ChatPanel';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'TOROS Oyunlar | Kasa Açma & Mini Oyunlar',
  description:
    'TOROS Clan üyelerine özel kasa açma simülasyonu ve mini oyun platformu. Tamamen kozmetik, sıfır gerçek para.',
  icons: {
    icon: '/favicon.ico',
  },
  // TOROS fork: bu app /games path'inde unlisted (kullanıcı onay öncesi
  // navbar'a koymuyoruz). Search engine indexing'i de kapat ki Google
  // listesine düşmesin.
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <body className="bg-bg-primary text-white antialiased">
        <Providers>
          <div className="flex min-h-screen">
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <Header />
              
              {/* Page Content */}
              <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto px-4 py-6">
                  {children}
                </div>
              </main>
            </div>
            
            {/* Chat Panel */}
            <ChatPanel />
          </div>
          
          {/* Toast Notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e1e2d',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

