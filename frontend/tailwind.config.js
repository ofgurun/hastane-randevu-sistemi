/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        overlayIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        sheetIn: {
          from: { opacity: "0", transform: "translateY(16px) scale(.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        fadeUp: "fadeUp .28s ease both",
        overlayIn: "overlayIn .2s ease both",
        sheetIn: "sheetIn .24s cubic-bezier(.2,.8,.2,1) both",
      },
    },
  },
  plugins: [],
};
