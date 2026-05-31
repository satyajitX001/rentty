import React, { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, Switch, StyleSheet, Text, TextInput, View } from "react-native";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  createDrawerNavigator,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { RootNavigator } from "./RootNavigator";
import { useAuth } from "../store/AuthContext";
import { colors, fonts, radii } from "../theme/tokens";
import { getDashboardSummary } from "../services/api/dashboardService";
import { queryKeys } from "../services/api/queryKeys";
import { changePassword, updateProfile } from "../services/api/authService";

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
  const { user, signOut, themeMode, toggleThemeMode, updateUser } = useAuth();
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const summaryQuery = useQuery({ queryKey: queryKeys.dashboard.summary, queryFn: getDashboardSummary });
  const summary = summaryQuery.data ?? { totalProperties: 0, occupiedProperties: 0, availableProperties: 0 };
  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (nextUser) => {
      updateUser(nextUser);
      setIsProfileVisible(false);
    },
    onError: (error) => {
      Alert.alert("Profile update failed", error instanceof Error ? error.message : "Unable to update profile.");
    },
  });
  const canSaveProfile = name.trim().length >= 2 && phone.trim().length >= 8 && !profileMutation.isPending;
  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setIsPasswordVisible(false);
      Alert.alert("Password updated", "Use the new password on your next login.");
    },
    onError: (error) => {
      Alert.alert("Password update failed", error instanceof Error ? error.message : "Unable to update password.");
    },
  });
  const canChangePassword = currentPassword.length > 0 && newPassword.length >= 6 && !passwordMutation.isPending;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
      <View style={styles.profileWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.name)}</Text>
        </View>
        <View style={styles.profileMeta}>
          <Text style={styles.profileName}>{user?.name ?? "RentOk User"}</Text>
          <Text style={styles.profileSub}>{(user?.role ?? "caretaker").toUpperCase()}</Text>
          <Text style={styles.propertyCount}>{summary.totalProperties} Properties</Text>
        </View>
      </View>

      <Pressable
        style={styles.editProfileButton}
        onPress={() => {
          setName(user?.name ?? "");
          setPhone(user?.phone ?? "");
          setIsProfileVisible(true);
        }}
      >
        <Ionicons name="person-circle-outline" color={colors.primaryDark} size={18} />
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </Pressable>
      <Pressable
        style={styles.editProfileButton}
        onPress={() => {
          setCurrentPassword("");
          setNewPassword("");
          setIsPasswordVisible(true);
        }}
      >
        <Ionicons name="key-outline" color={colors.primaryDark} size={18} />
        <Text style={styles.editProfileText}>Change Password</Text>
      </Pressable>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, styles.occupiedBox]}>
          <Text style={styles.statValue}>{summary.occupiedProperties}</Text>
          <Text style={styles.statLabel}>Occupied</Text>
        </View>
        <View style={[styles.statBox, styles.availableBox]}>
          <Text style={styles.statValue}>{summary.availableProperties}</Text>
          <Text style={styles.statLabel}>Available</Text>
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

      <Modal visible={isProfileVisible} transparent animationType="slide" onRequestClose={() => setIsProfileVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsProfileVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>Keep owner/caretaker contact details updated for property operations.</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Mobile number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsProfileVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, !canSaveProfile && styles.buttonDisabled]}
                disabled={!canSaveProfile}
                onPress={() => profileMutation.mutate({ name: name.trim(), phone: phone.trim() })}
              >
                {profileMutation.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.primaryButtonText}>Save</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isPasswordVisible} transparent animationType="slide" onRequestClose={() => setIsPasswordVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsPasswordVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>For security, confirm your current password before setting a new one.</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsPasswordVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, !canChangePassword && styles.buttonDisabled]}
                disabled={!canChangePassword}
                onPress={() => passwordMutation.mutate({ currentPassword, newPassword })}
              >
                {passwordMutation.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.primaryButtonText}>Update</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  propertyCount: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 11,
    marginTop: 2,
  },
  editProfileButton: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editProfileText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 18,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  occupiedBox: {
    backgroundColor: "#FFF8E7",
    borderWidth: 1,
    borderColor: "#FFD966",
  },
  availableBox: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#81C784",
  },
  statValue: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  statLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 2,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(9,18,39,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 20,
    flex: 1,
  },
  modalMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 13,
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
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
