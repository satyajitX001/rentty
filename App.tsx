import "react-native-reanimated";
import "react-native-gesture-handler";
import React from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppStackNavigator } from "./src/navigation/AppStackNavigator";
import { AuthStackNavigator } from "./src/navigation/AuthStackNavigator";
import { queryClient } from "./src/services/api/queryClient";
import { AuthProvider, useAuth } from "./src/store/AuthContext";
import { colors, fonts } from "./src/theme/tokens";

function AppShell() {
  const { isAuthenticated, isHydrating, themeMode } = useAuth();

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
      theme={
        themeMode === "dark"
          ? {
              ...DarkTheme,
              colors: {
                ...DarkTheme.colors,
                primary: colors.primary,
                background: "#0D152A",
                card: "#132040",
                border: "#243760",
                text: "#F1F5FF"
              }
            }
          : {
              ...DefaultTheme,
              colors: {
                ...DefaultTheme.colors,
                background: colors.page,
                card: colors.surface,
                border: colors.border,
                text: colors.textPrimary,
                primary: colors.primary
              }
            }
      }
      children={
        <>
          <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
          {isAuthenticated ? <AppStackNavigator /> : <AuthStackNavigator />}
        </>
      }
    />
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider children={<AppShell />} />
      </QueryClientProvider>
    </GestureHandlerRootView>
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
