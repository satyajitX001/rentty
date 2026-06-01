import React, { ReactNode } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";

type Props = {
  title: string;
  value?: string;
  rightNode?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function InfoCard({ title, value, rightNode, children, style }: Props) {
  const { colors, fonts, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {rightNode}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {children}
    </View>
  );
}

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
    ...shadows.card
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  title: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fonts.heading
  },
  value: {
    fontSize: 26,
    color: colors.textPrimary,
    fontFamily: fonts.display
  }
});
