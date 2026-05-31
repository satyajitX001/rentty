import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { Pill } from "../components/Pill";
import { getPayments } from "../services/api/collectionService";
import { queryKeys } from "../services/api/queryKeys";
import { getTenants, removeTenant } from "../services/api/tenantService";
import { colors, fonts, radii } from "../theme/tokens";
import { AppStackParamList } from "../navigation/AppStackNavigator";

const money = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

type Props = NativeStackScreenProps<AppStackParamList, "PropertyActions">;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function PropertyActionsScreen({ navigation, route }: Props) {
  const { property } = route.params;
  const queryClient = useQueryClient();
  const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false);
  const [removeReason, setRemoveReason] = useState("");
  const [tenantRemovedLocally, setTenantRemovedLocally] = useState(false);

  const tenantsQuery = useQuery({
    queryKey: [...queryKeys.tenants.list, "property", property.id, "history"],
    queryFn: () => getTenants({ propertyId: property.id, includeInactive: true }),
  });
  const paymentsQuery = useQuery({
    queryKey: [...queryKeys.collections.payments, "property", property.id],
    queryFn: () => getPayments({ propertyId: property.id }),
  });

  const tenants = tenantsQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const currentTenant = tenants.find((tenant) => tenant.active !== false && tenant.status === "active");
  const isOccupied = Boolean(currentTenant) && !tenantRemovedLocally;
  const tenantNameById = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.id, tenant.fullName])),
    [tenants]
  );
  const totalReceived = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const canRemoveTenant = Boolean(currentTenant?.id) && removeReason.trim().length >= 3;

  const invalidatePropertyFlow = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.payments }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
    ]);
  };

  const removeTenantMutation = useMutation({
    mutationFn: ({ tenantId, reason }: { tenantId: string; reason: string }) =>
      removeTenant(tenantId, { reason }),
    onSuccess: async () => {
      setTenantRemovedLocally(true);
      setRemoveReason("");
      setIsRemoveModalVisible(false);
      await invalidatePropertyFlow();
      Alert.alert("Tenant removed", "The property is now available for a new tenant.");
    },
    onError: (error) => {
      Alert.alert("Unable to remove tenant", getErrorMessage(error));
    },
  });

  const handleEditProperty = () => {
    navigation.navigate("PropertyForm", { property });
  };

  const handleAddTenant = () => {
    if (isOccupied) return;
    navigation.navigate("TenantForm", {
      propertyId: property.id,
      propertyName: property.name,
      propertyAddress: property.address,
    });
  };

  const handleAssignCaretaker = () => {
    navigation.navigate("AssignCaretaker", { property });
  };

  return (
    <Screen title={property.name} subtitle={property.address}>
      <View style={styles.container}>
        <InfoCard
          title="Property Status"
          rightNode={
            <Pill
              label={(isOccupied ? "occupied" : "available").toUpperCase()}
              tone={isOccupied ? "warning" : "success"}
            />
          }
        >
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{property.type?.toUpperCase() ?? "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Caretaker</Text>
            <Text style={styles.infoValue}>{property.caretakerPhone ?? "Not assigned"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Tenant</Text>
            <Text style={styles.infoValue}>{currentTenant && isOccupied ? currentTenant.fullName : "None"}</Text>
          </View>
        </InfoCard>

        <InfoCard title="Manage Property">
          <Pressable style={styles.actionButton} onPress={handleEditProperty}>
            <View style={styles.actionIcon}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Edit Property</Text>
              <Text style={styles.actionSubtitle}>Modify name, address, type and details</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.actionButton, isOccupied && styles.disabledButton]}
            onPress={handleAddTenant}
            disabled={isOccupied}
          >
            <View style={[styles.actionIcon, isOccupied && styles.disabledIcon]}>
              <Ionicons name="person-add-outline" size={22} color={isOccupied ? colors.textMuted : colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, isOccupied && styles.disabledText]}>
                {isOccupied ? "Property Occupied" : "Add Tenant"}
              </Text>
              <Text style={styles.actionSubtitle}>
                {isOccupied ? "Remove current tenant before onboarding another" : "Onboard a new tenant"}
              </Text>
            </View>
            {!isOccupied && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          </Pressable>

          {isOccupied && currentTenant ? (
            <Pressable style={styles.actionButton} onPress={() => setIsRemoveModalVisible(true)}>
              <View style={[styles.actionIcon, styles.dangerIcon]}>
                <Ionicons name="person-remove-outline" size={22} color={colors.danger} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Remove Tenant</Text>
                <Text style={styles.actionSubtitle}>Vacate {currentTenant.fullName} and make property available</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}

          <Pressable style={styles.actionButton} onPress={handleAssignCaretaker}>
            <View style={styles.actionIcon}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Assign Caretaker</Text>
              <Text style={styles.actionSubtitle}>
                {property.caretakerPhone ? "Update caretaker details" : "Assign a caretaker"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        </InfoCard>

        <InfoCard title="Property Payment History" rightNode={<Pill label={money(totalReceived)} tone="success" />}>
          {paymentsQuery.isPending || tenantsQuery.isPending ? <ActivityIndicator color={colors.primary} /> : null}
          {!paymentsQuery.isPending && payments.length === 0 ? (
            <Text style={styles.emptyText}>No payments captured for this property yet.</Text>
          ) : null}
          {payments.slice(0, 20).map((payment) => (
            <View key={payment.id} style={styles.paymentRow}>
              <View style={styles.actionContent}>
                <Text style={styles.paymentTitle}>{money(payment.amount)}</Text>
                <Text style={styles.actionSubtitle}>
                  {tenantNameById.get(payment.tenantId) ?? "Past tenant"} | Paid {payment.paidOn.slice(0, 10)} | Due {payment.dueMonth}
                </Text>
                <Text style={styles.actionSubtitle}>{payment.receiptNo ?? payment.id}</Text>
              </View>
              <Pill label={payment.mode} tone="default" />
            </View>
          ))}
        </InfoCard>
      </View>

      <Modal visible={isRemoveModalVisible} transparent animationType="slide" onRequestClose={() => setIsRemoveModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove Tenant</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsRemoveModalVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>
              This will not delete tenant history or payments. The tenant will be marked vacated and this property becomes available.
            </Text>
            <Text style={styles.modalTenantName}>{currentTenant?.fullName}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={removeReason}
              onChangeText={setRemoveReason}
              placeholder="Reason, e.g. lease ended, shifted out"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsRemoveModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryDangerButton, !canRemoveTenant && styles.disabledButton]}
                disabled={!canRemoveTenant || removeTenantMutation.isPending}
                onPress={() => {
                  if (!currentTenant?.id) return;
                  removeTenantMutation.mutate({ tenantId: currentTenant.id, reason: removeReason.trim() });
                }}
              >
                {removeTenantMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Confirm Remove</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.page,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.heading,
    flex: 1,
    textAlign: "right",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerIcon: {
    backgroundColor: "#FEE2E2",
  },
  actionContent: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.heading,
  },
  actionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  disabledButton: {
    opacity: 0.7,
  },
  disabledIcon: {
    backgroundColor: colors.surfaceAlt,
  },
  disabledText: {
    color: colors.textMuted,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paymentTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 15,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
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
  modalTenantName: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 14,
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
  textArea: {
    minHeight: 82,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
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
  primaryDangerButton: {
    flex: 1,
    borderRadius: radii.button,
    backgroundColor: colors.danger,
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
});
