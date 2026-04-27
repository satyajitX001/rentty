import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootNavigator } from "./RootNavigator";

export type AppStackParamList = {
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="MainTabs" component={RootNavigator} />
    </Stack.Navigator>
  );
}
