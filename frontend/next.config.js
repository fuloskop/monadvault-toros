/** @type {import('next').NextConfig} */
// torosclan.com/games altında reverse-proxy ile servis ediliyoruz; tüm
// internal route/asset URL'lerinin /games prefix'i alması için basePath set.
// Dev'de boş bırakmak için BASE_PATH env'ini "" yapabilirsin.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/games';

const nextConfig = {
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    // Fix MetaMask SDK React Native async storage warning
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

module.exports = nextConfig;

