import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppDrawerNavigator } from "./AppDrawerNavigator";
import { PropertyFormScreen } from "../screens/PropertyFormScreen";
import { TenantFormScreen } from "../screens/TenantFormScreen";
import { TenantDetailsScreen } from "../screens/TenantDetailsScreen";
import { PropertyActionsScreen } from "../screens/PropertyActionsScreen";
import { AssignCaretakerScreen } from "../screens/AssignCaretakerScreen";
import { Property, Tenant } from "../types/models";

export type AppStackParamList = {
  MainTabs: undefined;
  PropertyForm: { property?: Property } | undefined;
  TenantForm: { propertyId: string; propertyName: string; propertyAddress: string };
  TenantDetails: { tenant: Tenant; property: Property };
  PropertyActions: { property: Property };
  AssignCaretaker: { property: Property };
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
      <Stack.Screen name="MainTabs" component={AppDrawerNavigator} />
      <Stack.Screen
        name="PropertyForm"
        component={PropertyFormScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TenantForm"
        component={TenantFormScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TenantDetails"
        component={TenantDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PropertyActions"
        component={PropertyActionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AssignCaretaker"
        component={AssignCaretakerScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
