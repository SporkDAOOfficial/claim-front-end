import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    breakpoints: {
      sm: "375px",
      md: "768px",
      lg: "1050px",
      xl: "1700px",
      "2xl": "2000px",
    },
  },
  globalCss: {
    a: {
      outline: "none",
      textDecoration: "none",
      _focus: { outline: "none", boxShadow: "none" },
      _hover: { textDecoration: "none" },
    },
  },
});

export const system = createSystem(defaultConfig, config);
