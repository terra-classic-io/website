module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        terra: {
          blue: '#2043B5',
          green: '#05C0A5',
          orange: '#FF784B',
          yellow: '#FFC93A',
          dark: '#0E0E21',
          light: '#F5F7FB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 10px 30px rgba(0, 0, 0, 0.12)',
        'dark-card': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'dark-card-hover': '0 10px 30px rgba(0, 0, 0, 0.4)',
      },
      backgroundColor: {
        primary: 'var(--color-bg-primary)',
        secondary: 'var(--color-bg-secondary)',
      },
      textColor: {
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
      },
    },
  },
  plugins: [],
};

