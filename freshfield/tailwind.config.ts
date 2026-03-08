import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f7f5f2',
        ink: '#1a1a18',
        soft: '#9a9690',
        line: '#dedad5',
        g1: '#2d6a2d',
        g2: '#3d8c3d',
        g3: '#5aad5a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"IM Fell English"', 'serif'],
        display: ['"Cormorant Garamond"', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
