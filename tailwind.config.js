export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    "bg-schema-1",
    "bg-schema-2",
    "bg-schema-3",
    "text-schema-1",
    "text-schema-2",
    "text-schema-3",
    "text-schema-4",
    "border-schema-1",
    "border-schema-2",
  ],
  theme: {
    extend: {
      colors: {
        "schema-1": "#0A2A47",
        "schema-2": "#3BAE3D",
        "schema-3": "#FFFFFF",
        "schema-4": "#333333",
      },
    },
  },
  plugins: [],
};