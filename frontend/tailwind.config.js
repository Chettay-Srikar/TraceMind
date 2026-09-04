/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#22C55E',
          dim:    '#16A34A',
          bright: '#4ADE80',
          glow:   'rgba(34,197,94,0.15)',
        },
        surface: {
          base:    '#020617',
          raised:  '#0E1223',
          overlay: '#141929',
          muted:   '#1A1E2F',
        },
        ink: {
          primary:   '#F8FAFC',
          secondary: '#94A3B8',
          muted:     '#64748B',
          disabled:  '#334155',
        },
        line: {
          DEFAULT: '#1E293B',
          strong:  '#334155',
        },
        status: {
          critical: '#EF4444',
          warning:  '#F59E0B',
          success:  '#22C55E',
          info:     '#3B82F6',
          muted:    '#64748B',
        },
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'h1':      ['2rem',  { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2':      ['1.5rem',{ lineHeight: '1.25',letterSpacing: '-0.015em',fontWeight: '600' }],
        'h3':      ['1.125rem',{ lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }],
        'label':   ['0.6875rem',{ lineHeight: '1', letterSpacing: '0.08em', fontWeight: '600', textTransform: 'uppercase' }],
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-lg':  '0 4px 24px rgba(0,0,0,0.5)',
        'glow-brand': '0 0 16px rgba(34,197,94,0.25)',
        'glow-critical': '0 0 16px rgba(239,68,68,0.3)',
        'glow-info': '0 0 16px rgba(59,130,246,0.2)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up': 'fadeUp 0.4s ease-out both',
        'slide-in': 'slideIn 0.3s ease-out both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
