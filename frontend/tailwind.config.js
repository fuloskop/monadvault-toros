/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // TOROS fork: brand palette toroscs design token'larına hizalandı.
        // Primary accent = TOROS altın (#d59120). Secondary = derin amber/turuncu.
        // Orijinal cyan+magenta upstream tonları kaldırıldı.

        // Primary - TOROS Gold
        primary: {
          50: '#fdf5e6',
          100: '#fbe8c0',
          200: '#f7d68a',
          300: '#f1bf52',
          400: '#e5a130',
          500: '#d59120',
          600: '#a87018',
          700: '#7a5012',
          800: '#4d320c',
          900: '#1f1404',
        },
        // Secondary - Deep Ember
        secondary: {
          50: '#fef2e6',
          100: '#fde0bf',
          200: '#fac68a',
          300: '#f5a753',
          400: '#ee8527',
          500: '#d56b15',
          600: '#a85410',
          700: '#7a3d0c',
          800: '#4d2607',
          900: '#1f0f03',
        },
        // Background - TOROS dark (toroscs ile aynı)
        bg: {
          primary: '#0a0a0a',
          secondary: '#141414',
          tertiary: '#1a1a1a',
          elevated: '#222222',
          card: '#1a1a1a',
        },
        // Success/Win
        success: {
          400: '#4ade80',
          500: '#22c55e',
        },
        // Danger/Lose
        danger: {
          400: '#f87171',
          500: '#ef4444',
        },
        // Warning
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        // Rarity Tiers
        rarity: {
          common: '#9ca3af',
          uncommon: '#3b82f6',
          rare: '#8b5cf6',
          epic: '#d946ef',
          legendary: '#f59e0b',
          mythic: '#ef4444',
        },
        // Text
        text: {
          primary: '#ffffff',
          secondary: '#a1a1aa',
          muted: '#71717a',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Exo 2', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        // TOROS gold glow
        'glow-primary': '0 0 20px rgba(213, 145, 32, 0.4)',
        'glow-secondary': '0 0 20px rgba(213, 107, 21, 0.4)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.4)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(213, 145, 32, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(213, 145, 32, 0.6)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

