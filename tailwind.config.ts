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
      // Paleta Azul Pastel Principal + Complementarios Pastel
      canvas: '#EAF4FB',     // Principal (60%): Azul Pastel Luminoso
      surface: '#F9E6D8',    // Secundario (30%): Melocotón / Arena Pastel (complementario directo del azul)
      'surface-blue': '#D5E9F7', // Azul Pastel Suave secundario para contenedores y bordes
      ink: '#16324F',        // Tipografía y contraste: Azul Marino Profundo Sobrio
      accent: '#C86D51',     // Acento (10%): Coral / Terracota Complementario para CTAs y estados activos
      white: '#FFFFFF',
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
