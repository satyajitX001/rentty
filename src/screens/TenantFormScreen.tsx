import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { DateField } from "../components/DateField";
import { createTenant } from "../services/api/tenantService";
import { queryKeys } from "../services/api/queryKeys";
import { colors, fonts, radii } from "../theme/tokens";
import { AppStackParamList } from "../navigation/AppStackNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "TenantForm">;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unable to save tenant.";
}

export function TenantFormScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();
  const { propertyId, propertyName, propertyAddress } = route.params;

  const [tenantName, setTenantName] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantRent, setTenantRent] = useState("");
  const [tenantRentDay, setTenantRentDay] = useState("");
  const [tenantJoinedOn, setTenantJoinedOn] = useState("");
  const [tenantAdvance, setTenantAdvance] = useState("");
  const [tenantOpeningDue, setTenantOpeningDue] = useState("");

  const createTenantMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tenants.list }),
        queryClient.invalidateQueries({ queryKey: queryKeys.properties.list }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
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
      advanceAmount: Number(tenantAdvance || 0),
      openingDueAmount: Number(tenantOpeningDue || 0),
    });
  };

  return (
    <Screen
      title="Add Tenant"
      subtitle={`${propertyName} - ${propertyAddress}`}
      children={
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <InfoCard title="Tenant Information">
            <TextInput
              style={styles.input}
              placeholder="Tenant name"
              placeholderTextColor={colors.textMuted}
              value={tenantName}
              onChangeText={setTenantName}
            />
            <TextInput
              style={styles.input}
              placeholder="Tenant address"
              placeholderTextColor={colors.textMuted}
              value={tenantAddress}
              onChangeText={setTenantAddress}
              multiline
            />
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
            <TextInput
              style={styles.input}
              placeholder="Monthly rent (INR)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={tenantRent}
              onChangeText={setTenantRent}
            />
            <TextInput
              style={styles.input}
              placeholder="Rent due day (1-31)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={tenantRentDay}
              onChangeText={setTenantRentDay}
            />
            <DateField
              value={tenantJoinedOn}
              onChange={setTenantJoinedOn}
              placeholder="Joined on"
            />
          </InfoCard>

          <InfoCard title="Financial Setup">
            <TextInput
              style={styles.input}
              placeholder="Advance amount (optional)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={tenantAdvance}
              onChangeText={setTenantAdvance}
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
        </ScrollView>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.page,
    paddingBottom: 20,
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
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 20,
    marginTop: 10,
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
    paddingHorizontal: 12,
    marginBottom: 10,
  },
});
</invoke>
