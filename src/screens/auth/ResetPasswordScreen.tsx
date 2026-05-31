import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { resetPassword } from "../../services/api/authService";
import type { AuthStackParamList } from "../../navigation/AuthStackNavigator";
import { colors, fonts, radii, shadows } from "../../theme/tokens";

type AuthNavigation = NativeStackNavigationProp<AuthStackParamList, "ResetPassword">;
type ResetPasswordRouteProp = RouteProp<AuthStackParamList, "ResetPassword">;

export function ResetPasswordScreen() {
  const navigation = useNavigation<AuthNavigation>();
  const route = useRoute<ResetPasswordRouteProp>();
  const { phone } = route.params;

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      Alert.alert("Success", "Password reset successfully. Please login with your new password.", [
        { text: "OK", onPress: () => navigation.navigate("Login") }
      ]);
    }
  });

  const canSubmit = 
    token.trim().length > 0 && 
    newPassword.length >= 6 && 
    newPassword === confirmPassword && 
    !resetMutation.isPending;

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.brand}>RentOk</Text>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter the code sent to {phone} and choose a new password.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Reset Code</Text>
        <TextInput
          style={styles.input}
          placeholder="6-digit code"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="number-pad"
          value={token}
          onChangeText={setToken}
        />

        <Text style={styles.label}>New Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Min 6 characters"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Repeat new password"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword && (
          <Text style={styles.error}>Passwords do not match</Text>
        )}

        {resetMutation.isError ? <Text style={styles.error}>{resetMutation.error.message}</Text> : null}

        <Pressable
          style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
          onPress={() => resetMutation.mutate({ token: token.trim(), newPassword })}
          disabled={!canSubmit}
        >
          {resetMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Reset Password</Text>
          )}
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.secondaryButtonText}>Back to Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: "#FFFFFF"
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14
  },
  eyeIcon: {
    paddingRight: 12
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
