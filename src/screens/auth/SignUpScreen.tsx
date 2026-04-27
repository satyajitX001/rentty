import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { register } from "../../services/api/authService";
import type { AuthStackParamList } from "../../navigation/AuthStackNavigator";
import { useAuth } from "../../store/AuthContext";
import { colors, fonts, radii, shadows } from "../../theme/tokens";

type AuthNavigation = NativeStackNavigationProp<AuthStackParamList, "SignUp">;

export function SignUpScreen() {
  const navigation = useNavigation<AuthNavigation>();
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "caretaker">("owner");

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
    phone.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length >= 6 &&
    !registerMutation.isPending;

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.brand}>RentOk</Text>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Set up your owner/caretaker account to start using RentOk.</Text>
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
        <TextInput
          style={styles.input}
          placeholder="+91-9000011111"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimum 6 characters"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>Role</Text>
        <View style={styles.roleRow}>
          <Pressable style={[styles.roleChip, role === "owner" && styles.roleChipActive]} onPress={() => setRole("owner")}>
            <Text style={[styles.roleText, role === "owner" && styles.roleTextActive]}>Owner</Text>
          </Pressable>
          <Pressable style={[styles.roleChip, role === "caretaker" && styles.roleChipActive]} onPress={() => setRole("caretaker")}>
            <Text style={[styles.roleText, role === "caretaker" && styles.roleTextActive]}>Caretaker</Text>
          </Pressable>
        </View>

        {registerMutation.isError ? <Text style={styles.error}>{registerMutation.error.message}</Text> : null}

        <Pressable
          style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
          onPress={() => registerMutation.mutate({ name: name.trim(), phone: phone.trim(), email: email.trim(), password, role })}
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
  roleRow: {
    flexDirection: "row",
    gap: 8
  },
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceAlt,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center"
  },
  roleChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  roleText: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 13
  },
  roleTextActive: {
    color: colors.primaryDark
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
