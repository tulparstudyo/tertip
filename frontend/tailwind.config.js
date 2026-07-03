/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        page: '0 4px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
