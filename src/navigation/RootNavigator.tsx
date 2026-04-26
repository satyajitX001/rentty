import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { DashboardScreen } from "../screens/DashboardScreen";
import { TenantsScreen } from "../screens/TenantsScreen";
import { CollectionsScreen } from "../screens/CollectionsScreen";
import { MaintenanceScreen } from "../screens/MaintenanceScreen";
import { ReportsScreen } from "../screens/ReportsScreen";
import { colors, fonts } from "../theme/tokens";

export type RootTabParamList = {
  Dashboard: undefined;
  Tenants: undefined;
  Collections: undefined;
  Maintenance: undefined;
  Reports: undefined;
};

const icons: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: "home-outline",
  Tenants: "people-outline",
  Collections: "wallet-outline",
  Maintenance: "construct-outline",
  Reports: "document-text-outline"
};

const activeIcons: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: "home",
  Tenants: "people",
  Collections: "wallet",
  Maintenance: "construct",
  Reports: "document-text"
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          backgroundColor: colors.surface
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fonts.heading
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? activeIcons[route.name as keyof RootTabParamList] : icons[route.name as keyof RootTabParamList]}
            color={color}
            size={size}
          />
        )
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tenants" component={TenantsScreen} />
      <Tab.Screen name="Collections" component={CollectionsScreen} />
      <Tab.Screen name="Maintenance" component={MaintenanceScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}
