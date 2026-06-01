import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";

type Props = {
  label: string;
  tone?: "default" | "success" | "warning" | "danger";
};

export function Pill({ label, tone = "default" }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const toneMap = {
    default: { bg: colors.primarySoft, text: colors.primaryDark },
    success: { bg: "#E8F8F1", text: colors.success },
    warning: { bg: "#FFF4E5", text: colors.warning },
    danger: { bg: "#FDEBEC", text: colors.danger }
  };
  const palette = toneMap[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const createStyles = ({ fonts, radii }: AppTheme) => StyleSheet.create({
  pill: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start"
  },
  text: {
    fontSize: 11,
    fontFamily: fonts.heading,
    letterSpacing: 0.2
  }
});
