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
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { RootNavigator } from "./RootNavigator";
import { useAuth } from "../store/AuthContext";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { getDashboardSummary } from "../services/api/dashboardService";
import { queryKeys } from "../services/api/queryKeys";
import { changePassword, updateProfile } from "../services/api/authService";
import { moderateScale, scale, verticalScale } from "../utils/scale";

export type AppDrawerParamList = {
  Home: undefined;
};

const Drawer = createDrawerNavigator<AppDrawerParamList>();
const tabHeaderTitles = {
  Dashboard: "Dashboard",
  Tenants: "Tenants",
  Collections: "Collections",
  Maintenance: "Maintenance",
  Reports: "Reports",
} as const;

function getHeaderTitleFromRoute(route: any) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? "Dashboard";
  return tabHeaderTitles[routeName as keyof typeof tabHeaderTitles] ?? "Dashboard";
}

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
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
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
        <Ionicons name="person-circle-outline" color={colors.primaryDark} size={moderateScale(18)} />
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
        <Ionicons name="key-outline" color={colors.primaryDark} size={moderateScale(18)} />
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
  const { colors, fonts } = useAppTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.textPrimary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontFamily: fonts.display, fontSize: moderateScale(20) },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textMuted,
        drawerLabelStyle: { fontFamily: fonts.heading, fontSize: moderateScale(13) },
        drawerStyle: { backgroundColor: colors.surface },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Home"
        component={RootNavigator}
        options={({ route }) => ({
          title: getHeaderTitleFromRoute(route),
          headerTitle: getHeaderTitleFromRoute(route),
          drawerIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={moderateScale(size)} />,
        })}
      />
    </Drawer.Navigator>
  );
}

const createStyles = ({ colors, fonts, radii }: AppTheme) => StyleSheet.create({
  drawerContainer: {
    flexGrow: 1,
  },
  profileWrap: {
    marginHorizontal: scale(12),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(18),
    padding: moderateScale(12),
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
    gap: scale(10),
  },
  avatar: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
  },
  avatarText: {
    color: "#FFFFFF",
    fontFamily: fonts.display,
    fontSize: moderateScale(14),
  },
  profileMeta: {
    flex: 1,
    gap: verticalScale(3),
  },
  profileName: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: moderateScale(14),
  },
  profileSub: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: moderateScale(12),
  },
  propertyCount: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },
  editProfileButton: {
    marginHorizontal: scale(12),
    marginBottom: verticalScale(12),
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  editProfileText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: moderateScale(13),
  },
  statsRow: {
    flexDirection: "row",
    gap: scale(10),
    marginHorizontal: scale(12),
    marginBottom: verticalScale(18),
  },
  statBox: {
    flex: 1,
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    alignItems: "center",
  },
  occupiedBox: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  availableBox: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.success,
  },
  statValue: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: moderateScale(18),
  },
  statLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },
  settingsBlock: {
    marginTop: "auto",
    marginHorizontal: scale(12),
    marginBottom: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: verticalScale(12),
    gap: verticalScale(8),
  },
  settingsTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: moderateScale(12),
  },
  themeRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: moderateScale(13),
  },
  logoutText: {
    color: colors.danger,
    fontFamily: fonts.heading,
    fontSize: moderateScale(13),
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
    padding: moderateScale(16),
    gap: verticalScale(10),
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(10),
  },
  modalTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: moderateScale(20),
    flex: 1,
  },
  modalMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: moderateScale(12),
  },
  modalCloseButton: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: moderateScale(13),
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(11),
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: moderateScale(14),
  },
  modalActions: {
    flexDirection: "row",
    gap: scale(8),
  },
  primaryButton: {
    flex: 1,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    minHeight: verticalScale(42),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(14),
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: moderateScale(13),
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minHeight: verticalScale(42),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(14),
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: moderateScale(13),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
