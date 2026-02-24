export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0a0d14",
          card: "#111827",
          border: "#1f2937",
          gold: "#f59e0b",
          blue: "#3b82f6",
          red: "#ef4444",
          green: "#10b981",
          muted: "#6b7280",
        }
      },
      fontFamily: {
        display: ["Rajdhani", "sans-serif"],
        body: ["Inter", "sans-serif"],
      }
    }
  },
  plugins: []
}
