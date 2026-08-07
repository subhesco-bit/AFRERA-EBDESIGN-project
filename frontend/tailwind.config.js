/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // ---------------------------------------------------------------
        // AFRERA domain tokens (see src/index.css for the rationale).
        // Exposed to Tailwind so components write `bg-perishable` or
        // `text-sev-critical` instead of inventing their own hex values.
        // ---------------------------------------------------------------
        brandAccent: {
          DEFAULT: 'hsl(var(--brand-accent))',
          foreground: 'hsl(var(--brand-accent-foreground))',
        },
        perishable: {
          DEFAULT: 'hsl(var(--perishable))',
          foreground: 'hsl(var(--perishable-foreground))',
        },
        ambient: {
          DEFAULT: 'hsl(var(--ambient))',
          foreground: 'hsl(var(--ambient-foreground))',
        },
        coldchain: {
          ok: 'hsl(var(--coldchain-ok))',
          warn: 'hsl(var(--coldchain-warn))',
          breach: 'hsl(var(--coldchain-breach))',
        },
        provenance: {
          gi: 'hsl(var(--gi-verified))',
          organic: 'hsl(var(--organic-certified))',
          unverified: 'hsl(var(--unverified))',
        },
        sev: {
          info: 'hsl(var(--sev-info))',
          notice: 'hsl(var(--sev-notice))',
          warning: 'hsl(var(--sev-warning))',
          critical: 'hsl(var(--sev-critical))',
          emergency: 'hsl(var(--sev-emergency))',
        },
        data: {
          real: 'hsl(var(--data-real))',
          estimated: 'hsl(var(--data-estimated))',
          assumed: 'hsl(var(--data-assumed))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
