/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        sidebar: 'var(--bg-sidebar)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          soft: 'var(--color-primary-soft)',
          hover: 'var(--color-primary-hover)',
        },
        secondary: 'var(--color-secondary)',
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        status: {
          open: 'var(--status-open)',
          'open-bg': 'var(--status-open-bg)',
          progress: 'var(--status-progress)',
          'progress-bg': 'var(--status-progress-bg)',
          resolved: 'var(--status-resolved)',
          'resolved-bg': 'var(--status-resolved-bg)',
        },
        severity: {
          low: 'var(--severity-low)',
          'low-bg': 'var(--severity-low-bg)',
          medium: 'var(--severity-medium)',
          'medium-bg': 'var(--severity-medium-bg)',
          high: 'var(--severity-high)',
          'high-bg': 'var(--severity-high-bg)',
        }
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        pill: '9999px',
      },
      boxShadow: {
        e1: 'var(--shadow-e1)',
        e2: 'var(--shadow-e2)',
        e3: 'var(--shadow-e3)',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
