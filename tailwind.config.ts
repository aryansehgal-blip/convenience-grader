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
        primary: {
          DEFAULT: '#FF6B35',
          50: '#FFE8E0',
          100: '#FFD4C6',
          200: '#FFAC92',
          300: '#FF845E',
          400: '#FF6B35',
          500: '#FF5214',
          600: '#E03C00',
          700: '#AD2E00',
          800: '#7A2000',
          900: '#471300',
        },
        secondary: {
          DEFAULT: '#004E89',
          50: '#E0F2FF',
          100: '#B3DEFF',
          200: '#80C7FF',
          300: '#4DB0FF',
          400: '#2699FF',
          500: '#0082FF',
          600: '#0068CC',
          700: '#004E89',
          800: '#003456',
          900: '#001A23',
        },
      },
    },
  },
  plugins: [],
};

export default config;
