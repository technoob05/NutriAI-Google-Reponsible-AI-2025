export const themes = {
  light: {
    brand: {
      primary: "hsl(156, 95%, 35%)",  // NutriAI green
      secondary: "hsl(156, 80%, 45%)", 
      accent: "hsl(180, 75%, 45%)",
    },
    background: {
      primary: "hsl(0, 0%, 100%)",
      secondary: "hsl(156, 20%, 98%)",
      tertiary: "hsl(156, 15%, 95%)",
    },
    text: {
      primary: "hsl(222, 47%, 11%)",
      secondary: "hsl(217, 19%, 27%)",
      muted: "hsl(215, 16%, 47%)",
    },
    border: {
      default: "hsl(216, 12%, 84%)",
      muted: "hsl(216, 12%, 92%)",
    },
    states: {
      hover: "hsla(156, 95%, 35%, 0.1)",
      selected: "hsla(156, 95%, 35%, 0.15)",
    }
  },
  dark: {
    brand: {
      primary: "hsl(156, 85%, 45%)",
      secondary: "hsl(156, 70%, 40%)",
      accent: "hsl(180, 65%, 40%)", 
    },
    background: {
      primary: "hsl(222, 47%, 11%)",
      secondary: "hsl(217, 33%, 17%)",
      tertiary: "hsl(215, 27%, 21%)",
    },
    text: {
      primary: "hsl(0, 0%, 98%)",
      secondary: "hsl(217, 19%, 80%)",
      muted: "hsl(215, 16%, 65%)",
    },
    border: {
      default: "hsl(216, 12%, 27%)",
      muted: "hsl(216, 12%, 32%)",
    },
    states: {
      hover: "hsla(156, 85%, 45%, 0.15)",
      selected: "hsla(156, 85%, 45%, 0.2)",
    }
  }
}
