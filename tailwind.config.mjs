/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hufs: {
          green: '#146E7A',   // HUFS GREEN (R20 G110 B122)
          gray:  '#DADAD3',   // HUFS GRAY  (R218 G218 B211)
          navy:  '#002D56',   // HUFS NAVY  (R0 G45 B86)
          gold:  '#8D7150',   // HUFS GOLD  (R141 G113 B80)
          silver:'#9D9FA2',   // HUFS SILVER(R157 G159 B162)
        },
      },
      fontFamily: {
        sans: ['var(--font-hufs)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '2xl': '1rem' },
    },
  },
  plugins: [],
}