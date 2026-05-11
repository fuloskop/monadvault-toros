'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { RainbowKitProvider, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

// TOROS fork: web3 katmanı default olarak DEVRE DIŞI. Sökmek yerine env flag
// arkasına gizledik — upstream MonadVault sync'lerinde merge conflict olmasın
// diye kod yerinde duruyor, sadece runtime'da WagmiProvider mount edilmiyor.
// Wallet UI'sını açmak için NEXT_PUBLIC_WEB3_ENABLED=true ile build.
const WEB3_ENABLED = process.env.NEXT_PUBLIC_WEB3_ENABLED === 'true';

// Define Monad chain
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { http: ['https://testnet.monad.xyz/v1'] },
    public: { http: ['https://testnet.monad.xyz/v1'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
  testnet: true,
} as const;

// Create wagmi config (only used when WEB3_ENABLED)
const config = WEB3_ENABLED
  ? getDefaultConfig({
      appName: 'TOROS Games',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
      chains: [monadTestnet],
      transports: {
        [monadTestnet.id]: http(),
      },
      ssr: true,
    })
  : null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

// Custom RainbowKit theme
const customTheme = darkTheme({
  accentColor: '#00e5f0',
  accentColorForeground: '#0a0a0f',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});

customTheme.colors.modalBackground = '#12121a';
customTheme.colors.modalBorder = 'rgba(255, 255, 255, 0.1)';
customTheme.colors.profileForeground = '#1a1a26';
customTheme.colors.closeButton = '#a1a1aa';
customTheme.colors.closeButtonBackground = 'rgba(255, 255, 255, 0.1)';

export function Providers({ children }: { children: ReactNode }) {
  if (!WEB3_ENABLED || !config) {
    // TOROS varsayılan: web3 kapalı. Auth toroscs iron-session cookie'sinden
    // okunuyor (aynı domain altında /games path-based mount edildiği için
    // tarayıcı cookie'yi otomatik gönderiyor).
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
