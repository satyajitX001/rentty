import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { requestPasswordReset } from "../../services/api/authService";
import type { AuthStackParamList } from "../../navigation/AuthStackNavigator";
import { AppTheme, useAppTheme, useThemedStyles } from "../../theme";

type AuthNavigation = NativeStackNavigationProp<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<AuthNavigation>();
  const [phone, setPhone] = useState("");

  const resetMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      navigation.navigate("ResetPassword", { phone });
    }
  });

  const canSubmit = phone.trim().length > 0 && !resetMutation.isPending;

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.brand}>RentOk</Text>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>Enter your phone number to receive a reset code.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          placeholder="+91-9000011111"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {resetMutation.isError ? <Text style={styles.error}>{resetMutation.error.message}</Text> : null}

        <Pressable
          style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
          onPress={() => resetMutation.mutate(phone.trim())}
          disabled={!canSubmit}
        >
          {resetMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Send Reset Code</Text>
          )}
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Back to Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) => StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.page,
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 24,
    gap: 18
  },
  hero: {
    gap: 6
  },
  brand: {
    color: colors.primary,
    fontFamily: fonts.display,
    fontSize: 20
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 28
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
    ...shadows.card
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 12
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14
  },
  primaryButton: {
    marginTop: 6,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 14
  },
  secondaryButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 13
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.heading,
    fontSize: 12
  },
  buttonDisabled: {
    opacity: 0.6
  }
});
