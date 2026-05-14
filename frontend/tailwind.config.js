export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: { 50:'#f0f4ff', 100:'#e0eaff', 500:'#4f6ef7', 600:'#3d5ce8', 700:'#2f4bcc' },
        surface: { 50:'#f8fafc', 100:'#f1f5f9', 800:'#1e293b', 900:'#0f172a', 950:'#020617' },
      }
    }
  },
  plugins: []
}
