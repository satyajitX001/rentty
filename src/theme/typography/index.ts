import { Platform } from "react-native";

export const fontFamilies = {
  display: Platform.select({ ios: "AvenirNext-Bold", android: "sans-serif-medium", default: "System" }) ?? "System",
  heading: Platform.select({ ios: "AvenirNext-DemiBold", android: "sans-serif-medium", default: "System" }) ?? "System",
  body: Platform.select({ ios: "AvenirNext-Regular", android: "sans-serif", default: "System" }) ?? "System",
};

export const fontSizes = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  display: 24,
};

export const typography = {
  fontFamilies,
  fontSizes,
};
