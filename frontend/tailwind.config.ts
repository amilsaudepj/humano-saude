import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        // ═══ Paleta Unificada Humano Saúde ═══
        // Azul Corporativo (Primary) — Confiança, Saúde, Profissionalismo
        brand: {
          50:  "#eef3ff",
          100: "#d9e4ff",
          200: "#bccfff",
          300: "#8eb0ff",
          400: "#5b8aff",
          500: "#3b6cf7",
          600: "#1e40af", // Primary Blue — botões, links, destaque
          700: "#1a3790",
          800: "#0f2240", // Dark Blue — headers, cards escuros
          900: "#0a1628", // Hero Background — seções escuras
          950: "#060e1a",
        },
        // Laranja CTA (Conversão) — Urgência, Ação
        cta: {
          400: "#fb923c",
          500: "#f97316", // Hover
          600: "#ea580c", // Default CTA
          700: "#c2410c", // Active
        },
        // Dourado — Design System Humano Saúde (#B8941F)
        gold: {
          50:  "#faf6eb",
          100: "#f2e9cc",
          200: "#e5d399",
          300: "#d4b85c",
          400: "#B8941F", // Gold padrão — cor principal dourada
          500: "#A07E18", // Hover/Active
          600: "#8A6C15", // Gold escuro
          700: "#6E5611",
          800: "#53410D",
          900: "#3A2D09",
          950: "#211A05",
        },
        piano: "#050505",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        montserrat: ["'Montserrat'", "var(--font-sans)", "sans-serif"],
        cinzel: ["var(--font-montserrat)", "sans-serif"],
        perpetua: ["var(--font-perpetua)", "serif"],
      },
      animation: {
        // Border Beam Animation (Magic UI style)
        "border-beam": "border-beam 3s linear infinite",
        
        // Mesh Gradient Movement
        "mesh-move": "mesh-move 15s ease-in-out infinite",
        
        // Shimmer Effect
        shimmer: "shimmer 2s linear infinite",
        
        // Gradient Shift
        "gradient-shift": "gradient-shift 8s linear infinite",
        
        // Float Animation
        float: "float 3s ease-in-out infinite",
        
        // Pulse Glow
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        
        // Scanner Line
        "scanner-line": "scanner-line 2s ease-in-out infinite",
        
        // Confetti
        confetti: "confetti 3s ease-out forwards",
      },
      keyframes: {
        "border-beam": {
          "0%": { offsetDistance: "0%" },
          "100%": { offsetDistance: "100%" },
        },
        "mesh-move": {
          "0%, 100%": {
            backgroundPosition: "0% 0%, 100% 100%, 50% 50%",
          },
          "33%": {
            backgroundPosition: "30% 20%, 70% 80%, 40% 60%",
          },
          "66%": {
            backgroundPosition: "70% 30%, 30% 70%, 60% 40%",
          },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 20px rgba(212, 175, 55, 0.5)",
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 40px rgba(212, 175, 55, 0.8)",
          },
        },
        "scanner-line": {
          "0%": {
            transform: "translateY(-100%)",
            opacity: "0",
          },
          "50%": {
            opacity: "1",
          },
          "100%": {
            transform: "translateY(100%)",
            opacity: "0",
          },
        },
        confetti: {
          "0%": {
            transform: "translateY(0) rotate(0deg)",
            opacity: "1",
          },
          "100%": {
            transform: "translateY(100vh) rotate(360deg)",
            opacity: "0",
          },
        },
      },
      backgroundImage: {
        // Dot Pattern (Seda Preta)
        "dot-pattern":
          "radial-gradient(circle at 2px 2px, rgba(212, 175, 55, 0.3) 1px, transparent 0)",
        
        // Grid Pattern
        "grid-pattern":
          "linear-gradient(to right, rgba(212, 175, 55, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(212, 175, 55, 0.1) 1px, transparent 1px)",
        
        // Gold Gradient
        "gold-gradient":
          "linear-gradient(135deg, #AA8A2E 0%, #D4AF37 25%, #F6E05E 50%, #D4AF37 75%, #AA8A2E 100%)",
        
        // Mesh Gradient
        "mesh-gradient": `
          radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(246, 224, 94, 0.06) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(170, 138, 46, 0.05) 0%, transparent 60%)
        `,
      },
      backgroundSize: {
        "dot-pattern": "40px 40px",
        "grid-pattern": "40px 40px",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
