/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "glass-border": "rgba(255,255,255,0.12)",
        "glass-bg": "rgba(255,255,255,0.06)",
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(34,211,238,.22), 0 12px 40px rgba(0,0,0,.45)",
        glow: "0 0 30px rgba(34,211,238,.18)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [],
};

