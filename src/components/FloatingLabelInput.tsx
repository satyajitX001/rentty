import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";

type Props = Pick<
  TextInputProps,
  "autoCapitalize" | "keyboardType" | "maxLength" | "multiline" | "secureTextEntry" | "textContentType"
> & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  hint?: string;
  required?: boolean;
};

/** A compact material-style field with an animated label that never hides context. */
export function FloatingLabelInput({
  label,
  value,
  onChangeText,
  hint,
  required = false,
  multiline = false,
  ...inputProps
}: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;
  const floated = focused || Boolean(value);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: floated ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [floated, progress]);

  return (
    <View style={[styles.field, focused && styles.fieldFocused, multiline && styles.fieldMultiline]}>
      <Animated.Text
        pointerEvents="none"
        style={[
          styles.label,
          { color: focused ? colors.primary : colors.textMuted },
          {
            transform: [
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, -7] }) },
              { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }) },
            ],
          },
        ]}
      >
        {label}{required ? " *" : ""}
      </Animated.Text>
      <TextInput
        {...inputProps}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholder={floated ? hint : undefined}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.inputMultiline]}
        textAlignVertical={multiline ? "top" : "center"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const createStyles = ({ colors, fonts, radii }: AppTheme) =>
  StyleSheet.create({
    field: {
      minHeight: 56,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.button,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      justifyContent: "center",
    },
    fieldFocused: {
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    fieldMultiline: {
      minHeight: 112,
    },
    label: {
      position: "absolute",
      left: 12,
      top: 12,
      fontFamily: fonts.body,
      fontSize: 15,
    },
    input: {
      minHeight: 55,
      paddingTop: 14,
      paddingBottom: 0,
      color: colors.textPrimary,
      fontFamily: fonts.body,
      fontSize: 15,
    },
    inputMultiline: {
      minHeight: 110,
      paddingTop: 20,
      paddingBottom: 10,
    },
  });
