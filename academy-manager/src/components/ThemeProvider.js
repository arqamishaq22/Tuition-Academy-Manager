"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// ThemeProvider wraps the application to enable Light & Dark theme support
export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export default ThemeProvider;

