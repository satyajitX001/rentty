import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { DateField } from "../components/DateField";
import { createTenant } from "../services/api/tenantService";
import { queryKeys } from "../services/api/queryKeys";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { AppStackParamList } from "../navigation/AppStackNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "TenantForm">;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unable to save tenant.";
}

export function TenantFormScreen({ navigation, route }: Props) {
  const { colors, fonts, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  const { propertyId, propertyName, propertyAddress } = route.params;

  const [tenantName, setTenantName] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantRent, setTenantRent] = useState("");
  const [tenantRentDay, setTenantRentDay] = useState("");
  const [tenantJoinedOn, setTenantJoinedOn] = useState("");
  const [tenantSecurityDeposit, setTenantSecurityDeposit] = useState("");
  const [tenantOpeningDue, setTenantOpeningDue] = useState("");

  const createTenantMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tenants.list }),
        queryClient.invalidateQueries({ queryKey: queryKeys.properties.list }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary, refetchType: "all" }),
      ]);
      navigation.goBack();
    },
  });

  const canSave = useMemo(
    () =>
      tenantName.trim().length >= 2 &&
      tenantAddress.trim().length >= 5 &&
      tenantPhone.trim().length >= 8 &&
      Number(tenantRent) >= 0 &&
      Number(tenantRentDay) >= 1 &&
      Number(tenantRentDay) <= 31 &&
      tenantJoinedOn.trim().length > 0 &&
      !createTenantMutation.isPending,
    [tenantName, tenantAddress, tenantPhone, tenantRent, tenantRentDay, tenantJoinedOn, createTenantMutation.isPending]
  );

  const handleSave = () => {
    if (!canSave) return;
    createTenantMutation.mutate({
      fullName: tenantName.trim(),
      fullAddress: tenantAddress.trim(),
      phone: tenantPhone.trim(),
      propertyId,
      monthlyRent: Number(tenantRent),
      rentDueDay: Number(tenantRentDay),
      joinedOn: tenantJoinedOn.trim(),
      securityDeposit: Number(tenantSecurityDeposit || 0),
      openingDueAmount: Number(tenantOpeningDue || 0),
    });
  };

  return (
    <Screen
      title="Add Tenant"
      subtitle={`${propertyName} - ${propertyAddress}`}
      reserveTabBarSpace={false}
      bottomComponent={
        <View style={styles.footer}>
          {createTenantMutation.isError ? (
            <Text style={styles.error}>{getErrorMessage(createTenantMutation.error)}</Text>
          ) : null}
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, !canSave && styles.disabled]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Text style={styles.primaryText}>
                {createTenantMutation.isPending ? "Saving..." : "Save Tenant"}
              </Text>
            </Pressable>
          </View>
        </View>
      }
      children={
        <>
          <InfoCard title="Tenant Information">
            <Text style={styles.fieldLabel}>
              Tenant name <Text style={styles.requiredMark}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Tenant name"
              placeholderTextColor={colors.textMuted}
              value={tenantName}
              onChangeText={setTenantName}
            />
            <Text style={styles.fieldLabel}>
              Tenant address <Text style={styles.requiredMark}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Tenant address"
              placeholderTextColor={colors.textMuted}
              value={tenantAddress}
              onChangeText={setTenantAddress}
              multiline
            />
            <Text style={styles.fieldLabel}>
              Mobile number <Text style={styles.requiredMark}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Mobile number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={tenantPhone}
              onChangeText={setTenantPhone}
            />
          </InfoCard>

          <InfoCard title="Rent Details">
            <Text style={styles.fieldLabel}>
              Monthly rent <Text style={styles.requiredMark}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Monthly rent (INR)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={tenantRent}
              onChangeText={setTenantRent}
            />
            <Text style={styles.fieldLabel}>
              Rent due day <Text style={styles.requiredMark}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Rent due day (1-31)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={tenantRentDay}
              onChangeText={setTenantRentDay}
            />
            <Text style={styles.fieldLabel}>
              Joined on <Text style={styles.requiredMark}>*</Text>
            </Text>
            <DateField
              value={tenantJoinedOn}
              onChange={setTenantJoinedOn}
              placeholder="Joined on"
            />
          </InfoCard>

          <InfoCard title="Financial Setup">
            <TextInput
              style={styles.input}
              placeholder="Security deposit (optional)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={tenantSecurityDeposit}
              onChangeText={setTenantSecurityDeposit}
            />
            <TextInput
              style={styles.input}
              placeholder="Opening due amount (optional)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={tenantOpeningDue}
              onChangeText={setTenantOpeningDue}
            />
          </InfoCard>
        </>
      }
    />
  );
}

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) => StyleSheet.create({
  fieldLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  requiredMark: {
    color: colors.danger,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  footer: {
    gap: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    borderRadius: radii.button,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radii.button,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  secondaryText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    color: colors.warning,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
});
