import { useMemo } from "react";
import type { Theme } from "@react-navigation/native";
import { darkColors, lightColors } from "./colorSchemes";
import { typography } from "./typography";
import { useAuth } from "../store/AuthContext";

export const radii = {
  card: 18,
  button: 12,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: "#10254E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
};

export const fonts = {
  display: typography.fontFamilies.display,
  heading: typography.fontFamilies.heading,
  body: typography.fontFamilies.body,
};

export type ThemeMode = "light" | "dark";
export type ThemeColors = typeof lightColors;

export type AppTheme = {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: typeof typography;
  fonts: typeof fonts;
  radii: typeof radii;
  shadows: typeof shadows;
};

const themeMap: Record<ThemeMode, AppTheme> = {
  light: {
    mode: "light",
    colors: lightColors,
    typography,
    fonts,
    radii,
    shadows,
  },
  dark: {
    mode: "dark",
    colors: darkColors,
    typography,
    fonts,
    radii,
    shadows,
  },
};

export const colors = lightColors;

export function getTheme(mode: ThemeMode): AppTheme {
  return themeMap[mode];
}

export function useAppTheme() {
  const { themeMode } = useAuth();
  return useMemo(() => getTheme(themeMode), [themeMode]);
}

export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useAppTheme();
  return useMemo(() => factory(theme), [factory, theme.mode]);
}

export function createNavigationTheme(mode: ThemeMode): Theme {
  const theme = getTheme(mode);
  return {
    dark: mode === "dark",
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.page,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
    fonts: {
      regular: { fontFamily: theme.fonts.body, fontWeight: "400" },
      medium: { fontFamily: theme.fonts.heading, fontWeight: "500" },
      bold: { fontFamily: theme.fonts.display, fontWeight: "700" },
      heavy: { fontFamily: theme.fonts.display, fontWeight: "700" }
    }
  };
}
