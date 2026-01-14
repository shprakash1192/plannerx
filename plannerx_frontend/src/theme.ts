import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7C3AED" },      // violet
    secondary: { main: "#22C55E" },    // green accent
    background: {
      default: "#0B0F19",              // deep navy/black
      paper: "#0F172A",                // slate-900
    },
    text: {
      primary: "#E5E7EB",
      secondary: "#9CA3AF",
    },
    divider: "rgba(255,255,255,0.10)",
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: [
      "Inter",
      "system-ui",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
    h3: { fontWeight: 700, letterSpacing: -0.5 },
    h4: { fontWeight: 700, letterSpacing: -0.4 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(255,255,255,0.08)",
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiSelect: {
      defaultProps: { size: "small" },
    },
  },
});