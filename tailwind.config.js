export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette "Teal clinico". Rimappa `blue` (usato ovunque nel codice)
        // sul teal del brand: 600 = primario, 500 = accento.
        blue: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD6',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0E7C7B',
          700: '#0B6463',
          800: '#0A4F4E',
          900: '#083B3A',
        },
        brand: {
          DEFAULT: '#0E7C7B',
          accent: '#14B8A6',
        },
      },
    },
  },
  plugins: [],
}
