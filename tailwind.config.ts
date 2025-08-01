import type { Config } from "tailwindcss";
const withMT = require("@material-tailwind/react/utils/withMT");

const config: Config = withMT({
  darkMode: "media",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'w-[400px]',
    'w-[450px]',
    'max-w-[450px]',
    'h-[220px]',
    'h-[250px]',
    'h-[270px]',
    'h-[320px]',
    'max-w-[90%]',
    'md:w-[800px]',
    'sm:max-w-[750px]',
    'sm:w-[200px]',
    'max-w-[90%]',
    'sm:max-w-[450px]',
    'md:max-w-[500px]',
    'h-[250px]',
    'xs:h-[180px]',
    'sm:h-[200px]',
    'md:h-[220px]',
  ],
  theme: {
    extend: {
      backgroundImage: {
        weather: "url('/image/background_home.png')",
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'gradient-pan': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        float:        'float 2.5s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
      },
    },
  },
  plugins: [],
});

export default config;
