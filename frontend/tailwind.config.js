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
        // Primary - Electric Cyan
        primary: {
          50: '#e0feff',
          100: '#b3fcff',
          200: '#80faff',
          300: '#4df7ff',
          400: '#1af5ff',
          500: '#00e5f0',
          600: '#00b8c2',
          700: '#008a94',
          800: '#005c66',
          900: '#002e38',
        },
        // Secondary - Neon Magenta
        secondary: {
          50: '#ffe5f7',
          100: '#ffb3e6',
          200: '#ff80d5',
          300: '#ff4dc4',
          400: '#ff1ab3',
          500: '#e600a1',
          600: '#b3007e',
          700: '#80005a',
          800: '#4d0036',
          900: '#1a0012',
        },
        // Background - Deep Space
        bg: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          tertiary: '#1a1a26',
          elevated: '#222232',
          card: '#1e1e2d',
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
        'glow-primary': '0 0 20px rgba(0, 229, 240, 0.4)',
        'glow-secondary': '0 0 20px rgba(230, 0, 161, 0.4)',
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
          '0%': { boxShadow: '0 0 5px rgba(0, 229, 240, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 229, 240, 0.6)' },
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

