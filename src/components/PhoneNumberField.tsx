import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { moderateScale, scale, verticalScale } from "../utils/scale";

const COUNTRY_FLAG = "🇮🇳";
const COUNTRY_CODE = "+91";
const LOCAL_PHONE_LENGTH = 10;

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export function normalizeLocalPhone(value: string) {
  const digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly.length <= LOCAL_PHONE_LENGTH) return digitsOnly;
  return digitsOnly.slice(-LOCAL_PHONE_LENGTH);
}

export function withCountryCode(localPhone: string) {
  return `${COUNTRY_CODE}${normalizeLocalPhone(localPhone)}`;
}

export function PhoneNumberField({ value, onChangeText, placeholder = "Enter 10-digit mobile number" }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.prefixWrap}>
        <Text style={styles.flag}>{COUNTRY_FLAG}</Text>
        <Text style={styles.code}>{COUNTRY_CODE}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(nextValue) => onChangeText(normalizeLocalPhone(nextValue))}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={LOCAL_PHONE_LENGTH}
        textContentType="telephoneNumber"
      />
    </View>
  );
}

const createStyles = ({ colors, fonts, radii }: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.button,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden",
    },
    prefixWrap: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: scale(10),
      minHeight: verticalScale(44),
      borderRightWidth: 1,
      borderRightColor: colors.border,
      gap: scale(6),
    },
    flag: {
      fontSize: moderateScale(16),
    },
    code: {
      color: colors.textSecondary,
      fontFamily: fonts.heading,
      fontSize: moderateScale(13),
    },
    input: {
      flex: 1,
      minHeight: verticalScale(44),
      paddingHorizontal: scale(12),
      color: colors.textPrimary,
      fontFamily: fonts.body,
      fontSize: moderateScale(14),
    },
  });
