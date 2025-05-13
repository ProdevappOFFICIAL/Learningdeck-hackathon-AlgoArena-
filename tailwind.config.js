
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    'src/renderer/src/index.html',
    'src/renderer/src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  darkMode: 'class',
  plugins: []
}
