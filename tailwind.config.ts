import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary (Slate)
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Accent (Indigo)
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Success (Emerald)
        success: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
        },
        // Danger (Rose)
        danger: {
          50: '#fff1f2',
          500: '#f43f5e',
          600: '#e11d48',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8rem', { lineHeight: '1.25rem' }],
        'base': ['0.88rem', { lineHeight: '1.5rem' }],
        'lg': ['1.05rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['2rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.5rem', { lineHeight: '2.75rem' }],
        '5xl': ['3.4rem', { lineHeight: '1.08' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        'container': '880px',
        'content': '720px',
        'wide': '1200px',
      },
      borderRadius: {
        'card': '14px',
        'button': '10px',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 12px 40px rgba(15, 23, 42, 0.1)',
      },
      backdropBlur: {
        'header': '12px',
      },
      animation: {
        'pulse-dot': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
export default config;
