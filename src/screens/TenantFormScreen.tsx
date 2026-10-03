import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { DateField } from "../components/DateField";
import { createTenant } from "../services/api/tenantService";
import { getProperty } from "../services/api/propertyService";
import { queryKeys } from "../services/api/queryKeys";
import { calculateFirstMonthProration, getProrationLabel } from "../utils/proration";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { AppStackParamList } from "../navigation/AppStackNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "TenantForm">;

function getErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);

  // Map common backend errors to user-friendly messages
  if (msg.includes("Property is currently occupied")) {
    return "This property already has an active tenant. Remove them first.";
  }
  if (msg.includes("joinedOn cannot be in the future")) {
    return "Joining date cannot be in the future.";
  }
  if (msg.includes("Property not found")) {
    return "Property not found. Please try again.";
  }
  if (msg.includes("Forbidden") || msg.includes("403")) {
    return "You don't have permission to add tenants to this property.";
  }
  if (msg.includes("network") || msg.includes("Network")) {
    return "Connection error. Please check your internet and try again.";
  }
  if (msg.includes("401") || msg.includes("Unauthorized")) {
    return "Session expired. Please log in again.";
  }
  if (msg.includes("validation") || msg.includes("Validation")) {
    return "Please check all required fields are filled correctly.";
  }

  // Generic fallback - don't show raw technical details
  return "Something went wrong. Please try again.";
}

export function TenantFormScreen({ navigation, route }: Props) {
  const { colors, fonts, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  const { propertyId, propertyName, propertyAddress } = route.params;

  // Fetch property to get prorationMode
  const { data: property } = useQuery({
    queryKey: queryKeys.properties.detail(propertyId),
    queryFn: () => getProperty(propertyId),
    enabled: !!propertyId,
  });

  const [tenantName, setTenantName] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantRent, setTenantRent] = useState("");
  const [tenantRentDay, setTenantRentDay] = useState("");
  const [tenantJoinedOn, setTenantJoinedOn] = useState("");
  const [tenantSecurityDeposit, setTenantSecurityDeposit] = useState("");
  const [tenantOpeningDue, setTenantOpeningDue] = useState("");
  const [tenantNotes, setTenantNotes] = useState("");

  // Calculate proration preview
  const prorationPreview = useMemo(() => {
    const rent = Number(tenantRent);
    const rentDay = Number(tenantRentDay);
    const joined = tenantJoinedOn.trim();
    const mode = property?.prorationMode ?? "pro_rata_daily";

    if (rent > 0 && rentDay >= 1 && rentDay <= 31 && joined.length > 0) {
      return calculateFirstMonthProration(rent, joined, rentDay, mode);
    }
    return null;
  }, [tenantRent, tenantRentDay, tenantJoinedOn, property?.prorationMode]);

  const createTenantMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tenants.list, exact: true }),
        queryClient.invalidateQueries({ queryKey: queryKeys.properties.list, exact: true }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary, exact: true }),
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
      remarks: tenantNotes.trim() || undefined,
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
              label="Joined on"
            />

            {prorationPreview && (
              <View style={styles.prorationPreview}>
                <Text style={styles.prorationPreviewLabel}>
                  First Month Calculation ({getProrationLabel(property?.prorationMode ?? "pro_rata_daily")})
                </Text>
                <Text style={styles.prorationPreviewDescription}>{prorationPreview.description}</Text>
                <View style={styles.prorationPreviewAmount}>
                  <Text style={styles.prorationPreviewAmountLabel}>First Month Rent:</Text>
                  <Text style={styles.prorationPreviewAmountValue}>
                    ₹{prorationPreview.amount.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
            )}
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
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={tenantNotes}
              onChangeText={setTenantNotes}
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
  prorationPreview: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  prorationPreviewLabel: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  prorationPreviewDescription: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 4,
  },
  prorationPreviewAmount: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  prorationPreviewAmountLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  prorationPreviewAmountValue: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: "700",
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
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
    paddingTop: 10,
    paddingBottom: 10,
  },
});
