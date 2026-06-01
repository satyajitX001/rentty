import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { login } from "../../services/api/authService";
import type { AuthStackParamList } from "../../navigation/AuthStackNavigator";
import { useAuth } from "../../store/AuthContext";
import { AppTheme, useAppTheme, useThemedStyles } from "../../theme";
import { PhoneNumberField, withCountryCode } from "../../components/PhoneNumberField";
import { moderateScale, scale, verticalScale } from "../../utils/scale";

type AuthNavigation = NativeStackNavigationProp<AuthStackParamList, "Login">;

export function LoginScreen() {
  const { colors, fonts, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
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

  const canSubmit = phone.trim().length === 10 && password.trim().length > 0 && !loginMutation.isPending;

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.brand}>RentOk</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to manage your hostels, tenants, and collections.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Phone</Text>
        <PhoneNumberField value={phone} onChangeText={setPhone} />

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
          onPress={() => loginMutation.mutate({ phone: withCountryCode(phone), password })}
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

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) => StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.page,
    paddingHorizontal: scale(18),
    paddingTop: verticalScale(56),
    paddingBottom: verticalScale(24),
    gap: verticalScale(18)
  },
  hero: {
    gap: verticalScale(6)
  },
  brand: {
    color: colors.primary,
    fontFamily: fonts.display,
    fontSize: moderateScale(20)
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: moderateScale(28)
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: moderateScale(13)
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: moderateScale(14),
    gap: verticalScale(10),
    ...shadows.card
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: moderateScale(12)
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceAlt
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(11),
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: moderateScale(14)
  },
  eyeIcon: {
    paddingRight: scale(12)
  },
  primaryButton: {
    marginTop: verticalScale(6),
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    minHeight: verticalScale(44),
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: moderateScale(14)
  },
  forgotPasswordText: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: moderateScale(12),
    alignSelf: "flex-end"
  },
  secondaryButton: {
    minHeight: verticalScale(42),
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: moderateScale(13)
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.heading,
    fontSize: moderateScale(12)
  },
  buttonDisabled: {
    opacity: 0.6
  }
});
