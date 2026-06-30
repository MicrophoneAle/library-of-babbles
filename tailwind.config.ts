import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#f3e6cf",
        walnut: "#2c1f15",
        mahogany: "#4e2f20",
        brass: "#b68d40",
        ivy: "#567046",
        ember: "#f1c27d",
      },
      backgroundImage: {
        "library-wall":
          "radial-gradient(ellipse at top, rgba(255,208,143,0.15), transparent 45%), linear-gradient(160deg, #1c120d 10%, #3b2518 45%, #1c120d 100%)",
      },
      boxShadow: {
        glow: "0 0 50px rgba(243, 186, 110, 0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
