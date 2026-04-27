import React from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { AppStackNavigator } from "./src/navigation/AppStackNavigator";
import { AuthStackNavigator } from "./src/navigation/AuthStackNavigator";
import { queryClient } from "./src/services/api/queryClient";
import { AuthProvider, useAuth } from "./src/store/AuthContext";
import { colors, fonts } from "./src/theme/tokens";

function AppShell() {
  const { isAuthenticated, isHydrating } = useAuth();

  if (isHydrating) {
    return (
      <View style={styles.startupLoader}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.startupText}>Restoring secure session...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.page,
          card: colors.surface,
          border: colors.border,
          text: colors.textPrimary,
          primary: colors.primary
        }
      }}
    >
      <StatusBar style="light" />
      {isAuthenticated ? <AppStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <View style={styles.container}>
          <AppShell />
        </View>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  startupLoader: {
    flex: 1,
    backgroundColor: colors.page,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  startupText: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 13
  }
});
