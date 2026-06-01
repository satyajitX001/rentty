import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { register } from "../../services/api/authService";
import type { AuthStackParamList } from "../../navigation/AuthStackNavigator";
import { useAuth } from "../../store/AuthContext";
import { AppTheme, useAppTheme, useThemedStyles } from "../../theme";
import { PhoneNumberField, withCountryCode } from "../../components/PhoneNumberField";
import { moderateScale, scale, verticalScale } from "../../utils/scale";

type AuthNavigation = NativeStackNavigationProp<AuthStackParamList, "SignUp">;

export function SignUpScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<AuthNavigation>();
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (result) => {
      if (result.token && result.refreshToken && result.user) {
        signIn({
          accessToken: result.token,
          refreshToken: result.refreshToken,
          user: result.user
        });
        return;
      }

      navigation.replace("Login");
    }
  });

  const canSubmit =
    name.trim().length > 0 &&
    phone.trim().length === 10 &&
    password.trim().length >= 6 &&
    !registerMutation.isPending;

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.brand}>RentOk</Text>
        <Text style={styles.title}>Create owner account</Text>
        <Text style={styles.subtitle}>Caretakers are onboarded by owner from Property - Assign Caretaker.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Satyajit Ray"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Phone</Text>
        <PhoneNumberField value={phone} onChangeText={setPhone} />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Minimum 6 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {registerMutation.isError ? <Text style={styles.error}>{registerMutation.error.message}</Text> : null}

        <Pressable
          style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
          onPress={() =>
            registerMutation.mutate({
              name: name.trim(),
              phone: withCountryCode(phone),
              password,
              role: "owner"
            })
          }
          disabled={!canSubmit}
        >
          {registerMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.secondaryButtonText}>Already have an account? Sign in</Text>
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(11),
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: moderateScale(14)
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
