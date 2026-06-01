import "react-native-reanimated";
import "react-native-gesture-handler";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppStackNavigator } from "./src/navigation/AppStackNavigator";
import { AuthStackNavigator } from "./src/navigation/AuthStackNavigator";
import { queryClient } from "./src/services/api/queryClient";
import { AuthProvider, useAuth } from "./src/store/AuthContext";
import { AppTheme, createNavigationTheme, useAppTheme, useThemedStyles } from "./src/theme";

function AppShell() {
  const { isAuthenticated, isHydrating, themeMode } = useAuth();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

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
      theme={createNavigationTheme(themeMode)}
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider children={<AppShell />} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const createStyles = ({ colors, fonts }: AppTheme) =>
  StyleSheet.create({
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
