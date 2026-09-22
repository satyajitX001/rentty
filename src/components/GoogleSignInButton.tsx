import React, { useState } from "react";
import { Pressable, Text, View, ActivityIndicator, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { useAuthRequest } from "expo-auth-session/providers/google";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { googleLogin } from "../services/api/authService";
import { useAuth } from "../store/AuthContext";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { moderateScale, scale, verticalScale } from "../utils/scale";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"; // Replace with actual Google Client ID

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  variant?: "default" | "outline" | "text";
  size?: "default" | "large";
  disabled?: boolean;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  variant = "default",
  size = "default",
  disabled = false,
}: GoogleSignInButtonProps) {
  const { colors, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      webClientId: GOOGLE_CLIENT_ID,
      iosClientId: GOOGLE_CLIENT_ID,
      androidClientId: GOOGLE_CLIENT_ID,
      expoClientId: GOOGLE_CLIENT_ID,
      redirectUri: makeRedirectUri({
        path: "auth/callback",
        native: "your.custom.scheme://auth/callback",
      }),
      scopes: ["profile", "email"],
      selectAccount: true,
    },
    {
      clientId: GOOGLE_CLIENT_ID,
      redirectUri: makeRedirectUri({
        path: "auth/callback",
        native: "your.custom.scheme://auth/callback",
      }),
    }
  );

  const googleLoginMutation = useMutation({
    mutationFn: googleLogin,
    onSuccess: (result) => {
      signIn({
        accessToken: result.token,
        refreshToken: result.refreshToken,
        user: result.user,
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Google login failed:", error);
      Alert.alert(
        "Google Sign In Failed",
        error.message || "Unable to sign in with Google. Please try again.",
        [{ text: "OK" }]
      );
      onError?.(error as Error);
    },
  });

  const handleGoogleSignIn = async () => {
    if (disabled || isLoading || !request) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await promptAsync();

      if (result?.type === "success" && result.params.id_token) {
        await googleLoginMutation.mutateAsync(result.params.id_token);
      } else if (result?.type !== "dismiss") {
        console.log("Google sign-in cancelled or failed:", result);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred during Google sign-in. Please try again.",
        [{ text: "OK" }]
      );
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonStyle = () => {
    switch (variant) {
      case "outline":
        return {
          ...styles.outlineButton,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        };
      case "text":
        return {
          ...styles.textButton,
          backgroundColor: "transparent",
        };
      default:
        return {
          ...styles.defaultButton,
          backgroundColor: "#4285F4", // Google blue
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "outline":
        return { ...styles.buttonText, color: colors.textPrimary };
      case "text":
        return { ...styles.buttonText, color: colors.primary };
      default:
        return { ...styles.buttonText, color: "#FFFFFF" };
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "outline":
        return colors.textPrimary;
      case "text":
        return colors.primary;
      default:
        return "#FFFFFF";
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        getButtonStyle(),
        size === "large" && styles.largeButton,
        pressed && { opacity: 0.9 },
        disabled && styles.disabledButton,
      ]}
      onPress={handleGoogleSignIn}
      disabled={disabled || isLoading || !request}
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={getIconColor()}
            style={styles.loadingIndicator}
          />
        ) : (
          <Ionicons
            name="logo-google"
            size={size === "large" ? 24 : 20}
            color={getIconColor()}
            style={styles.googleIcon}
          />
        )}
        <Text style={getTextStyle()}>
          {isLoading
            ? "Signing in..."
            : size === "large"
            ? "Sign in with Google"
            : "Google"}
        </Text>
      </View>
    </Pressable>
  );
}

const createStyles = ({ colors, radii, shadows }: AppTheme) => StyleSheet.create({
  defaultButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.button,
    paddingHorizontal: scale(20),
    paddingVertical: scale(12),
    ...shadows.button,
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.button,
    paddingHorizontal: scale(20),
    paddingVertical: scale(12),
    borderWidth: 1,
    ...shadows.button,
  },
  textButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
  },
  largeButton: {
    paddingHorizontal: scale(24),
    paddingVertical: scale(16),
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },
  googleIcon: {
    marginRight: scale(8),
  },
  loadingIndicator: {
    marginRight: scale(8),
  },
  disabledButton: {
    opacity: 0.6,
  },
});

const StyleSheet = { // Mock for style creation
  create: <T, U = (params: T) => any>(fn: U) => fn,
};