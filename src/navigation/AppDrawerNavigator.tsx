import React from "react";
import { Switch, StyleSheet, Text, View } from "react-native";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  createDrawerNavigator,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { RootNavigator } from "./RootNavigator";
import { useAuth } from "../store/AuthContext";
import { colors, fonts, radii } from "../theme/tokens";

export type AppDrawerParamList = {
  Home: undefined;
};

const Drawer = createDrawerNavigator<AppDrawerParamList>();

function initials(name?: string) {
  if (!name) return "RO";
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut, themeMode, toggleThemeMode } = useAuth();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
      <View style={styles.profileWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.name)}</Text>
        </View>
        <View style={styles.profileMeta}>
          <Text style={styles.profileName}>{user?.name ?? "RentOk User"}</Text>
          <Text style={styles.profileSub}>{(user?.role ?? "caretaker").toUpperCase()}</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>Tag: VERIFIED</Text>
            <Text style={styles.tag}>Role: {(user?.role ?? "caretaker").toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <DrawerItemList {...props} />

      <View style={styles.settingsBlock}>
        <Text style={styles.settingsTitle}>App Settings</Text>
        <View style={styles.themeRow}>
          <Text style={styles.themeLabel}>Theme Toggler</Text>
          <Switch value={themeMode === "dark"} onValueChange={toggleThemeMode} />
        </View>
      </View>

      <DrawerItem
        label="Logout"
        onPress={signOut}
        icon={({ color, size }) => <Ionicons name="log-out-outline" color={color} size={size} />}
        labelStyle={styles.logoutText}
      />
    </DrawerContentScrollView>
  );
}

export function AppDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        headerTitle: "RentOk",
        headerTintColor: colors.textPrimary,
        headerStyle: { backgroundColor: colors.surface },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textMuted,
        drawerLabelStyle: { fontFamily: fonts.heading, fontSize: 13 },
        drawerStyle: { backgroundColor: colors.surface },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Home"
        component={RootNavigator}
        options={{
          title: "Dashboard",
          drawerIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flexGrow: 1,
  },
  profileWrap: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 18,
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
  },
  avatarText: {
    color: "#FFFFFF",
    fontFamily: fonts.display,
    fontSize: 14,
  },
  profileMeta: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  profileSub: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  tag: {
    color: colors.primaryDark,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontFamily: fonts.heading,
    fontSize: 10,
  },
  settingsBlock: {
    marginTop: "auto",
    marginHorizontal: 12,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 8,
  },
  settingsTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  themeRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  logoutText: {
    color: colors.danger,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
});
