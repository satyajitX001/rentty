import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { colors } from "./src/theme/tokens";

export default function App() {
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
      <RootNavigator />
    </NavigationContainer>
  );
}
