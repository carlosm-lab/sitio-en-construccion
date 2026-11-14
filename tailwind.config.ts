import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      // Regla estricta de 3 colores pastel (60% / 30% / 10%)
      canvas: '#FAF7F2',  // 60% Alabastro Cálido Pastel (Lienzo y fondo principal)
      surface: '#DCE8E2', // 30% Verde Salvia Pastel (Tarjetas, cabeceras, badges, contenedores)
      ink: '#2C3E4C',     // 10% Pizarra Profundo Sobrio (Tipografía, iconos, CTAs y contrastes)
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
