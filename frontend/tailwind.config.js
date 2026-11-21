/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        app: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        sunken: 'var(--bg-sunken)',
        sidebar: 'var(--bg-sidebar)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          soft: 'var(--color-primary-soft)',
          hover: 'var(--color-primary-hover)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          soft: 'var(--color-accent-soft)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
        },
        status: {
          open: 'var(--status-open)',
          'open-soft': 'var(--status-open-soft)',
          'open-bg': 'var(--status-open-bg)',
          progress: 'var(--status-progress)',
          'progress-soft': 'var(--status-progress-soft)',
          'progress-bg': 'var(--status-progress-bg)',
          resolved: 'var(--status-resolved)',
          'resolved-soft': 'var(--status-resolved-soft)',
          'resolved-bg': 'var(--status-resolved-bg)',
        },
        severity: {
          low: 'var(--severity-low)',
          'low-soft': 'var(--severity-low-soft)',
          'low-bg': 'var(--severity-low-bg)',
          medium: 'var(--severity-medium)',
          'medium-soft': 'var(--severity-medium-soft)',
          'medium-bg': 'var(--severity-medium-bg)',
          high: 'var(--severity-high)',
          'high-soft': 'var(--severity-high-soft)',
          'high-bg': 'var(--severity-high-bg)',
        }
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        pill: '9999px',
      },
      height: {
        '13': '3.25rem',
        '76': '19rem',
      },
      spacing: {
        '13': '3.25rem',
        '76': '19rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        '2xs': '0 1px 2px rgba(31, 42, 36, 0.03)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        e1: 'var(--shadow-e1)',
        e2: 'var(--shadow-e2)',
        e3: 'var(--shadow-e3)',
      },
      zIndex: {
        content: 'var(--z-content)',
        header: 'var(--z-header)',
        'mobile-nav': 'var(--z-mobile-nav)',
        portal: 'var(--z-portal)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },
      fontFamily: {
        sans: ["'Public Sans'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        serif: ["'Source Serif 4'", "Georgia", "serif"],
      }
    },
  },
  plugins: [],
}
