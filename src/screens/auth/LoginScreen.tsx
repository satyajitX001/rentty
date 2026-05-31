import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { login } from "../../services/api/authService";
import type { AuthStackParamList } from "../../navigation/AuthStackNavigator";
import { useAuth } from "../../store/AuthContext";
import { colors, fonts, radii, shadows } from "../../theme/tokens";

type AuthNavigation = NativeStackNavigationProp<AuthStackParamList, "Login">;

export function LoginScreen() {
  const navigation = useNavigation<AuthNavigation>();
  const { signIn } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      signIn({
        accessToken: result.token,
        refreshToken: result.refreshToken,
        user: result.user
      });
    }
  });

  const canSubmit = phone.trim().length > 0 && password.trim().length > 0 && !loginMutation.isPending;

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.brand}>RentOk</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to manage your hostels, tenants, and collections.</Text>
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

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {loginMutation.isError ? <Text style={styles.error}>{loginMutation.error.message}</Text> : null}

        <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </Pressable>

        <Pressable
          style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
          onPress={() => loginMutation.mutate({ phone: phone.trim(), password })}
          disabled={!canSubmit}
        >
          {loginMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.secondaryButtonText}>Create a new account</Text>
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
  forgotPasswordText: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 12,
    alignSelf: "flex-end"
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
