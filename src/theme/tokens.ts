import { Platform } from "react-native";

export const colors = {
  page: "#F4F7FB",
  surface: "#FFFFFF",
  surfaceAlt: "#EFF3FA",
  textPrimary: "#0F172A",
  textSecondary: "#334155",
  textMuted: "#64748B",
  border: "#DDE5F2",
  primary: "#245CFF",
  primaryDark: "#163CB8",
  primarySoft: "#EAF0FF",
  success: "#0E9F6E",
  warning: "#C97804",
  danger: "#DC2626",
  heroStart: "#2C68FF",
  heroEnd: "#0B1D54"
};

export const radii = {
  card: 18,
  button: 12,
  pill: 999
};

export const fonts = {
  display: Platform.select({ ios: "AvenirNext-Bold", android: "sans-serif-medium", default: "System" }) ?? "System",
  heading: Platform.select({ ios: "AvenirNext-DemiBold", android: "sans-serif-medium", default: "System" }) ?? "System",
  body: Platform.select({ ios: "AvenirNext-Regular", android: "sans-serif", default: "System" }) ?? "System"
};

export const shadows = {
  card: {
    shadowColor: "#10254E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3
  }
};
