export default {
  content: ["./*.html", "./hub-controller.js", "./src/**/*.js", "./command-center/**/*.js"],
  theme: {
    extend: {
      colors: {
        void: "#06090e",
        hull: "#0a0f18",
        panel: "#101722",
        panel2: "#151f2e",
        line: "#223044",
        line2: "#314156",
        ink: "#f5f7fa",
        muted: "#8b95a3",
        dim: "#596577",
        cyan: "#6dd9ff",
        amber: "#ffb186",
        red: "#ff7a8a",
        green: "#7ddbb0",
        violet: "#b8a0ff"
      },
      fontFamily: {
        ui: ["Inter", "system-ui", "sans-serif"],
        display: ["Instrument Serif", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        glow: "0 0 40px rgba(109,217,255,.16)",
        insetline: "inset 0 1px 0 rgba(255,255,255,.05)"
      },
      animation: {
        scan: "scan 4s linear infinite",
        pulseSoft: "pulseSoft 2.8s ease-in-out infinite"
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" }
        },
        pulseSoft: {
          "0%,100%": { opacity: ".55" },
          "50%": { opacity: "1" }
        }
      }
    }
  },
  plugins: []
};
