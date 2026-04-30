import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { DateField } from "../components/DateField";
import {
  collectRent,
  getPayments,
  updatePayment,
} from "../services/api/collectionService";
import { getProperties } from "../services/api/propertyService";
import { queryKeys } from "../services/api/queryKeys";
import {
  getTenants,
  removeTenant,
  updateTenant,
} from "../services/api/tenantService";
import { colors, fonts, radii } from "../theme/tokens";
import { Payment, Property, Tenant } from "../types/models";

const money = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

const paymentModes: Payment["mode"][] = ["UPI", "CASH", "BANK_TRANSFER", "CARD"];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function inferDueMonth(dateInput: string) {
  return dateInput.trim().length >= 7 ? dateInput.slice(0, 7) : "";
}

export function TenantsScreen() {
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({ queryKey: queryKeys.tenants.list, queryFn: () => getTenants() });
  const propertiesQuery = useQuery({ queryKey: queryKeys.properties.list, queryFn: getProperties });

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [paymentEditor, setPaymentEditor] = useState<Payment | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDepositModalVisible, setIsDepositModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false);

  const [tenantName, setTenantName] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantRent, setTenantRent] = useState("");
  const [tenantRentDay, setTenantRentDay] = useState("");
  const [tenantJoinedOn, setTenantJoinedOn] = useState("");
  const [tenantAdvance, setTenantAdvance] = useState("");
  const [tenantOpeningDue, setTenantOpeningDue] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentDueMonth, setPaymentDueMonth] = useState("");
  const [paymentUtr, setPaymentUtr] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState<Payment["mode"]>("UPI");

  const [removeReason, setRemoveReason] = useState("");
  const [vacatedOn, setVacatedOn] = useState("");

  const paymentsQuery = useQuery({
    queryKey: [...queryKeys.collections.payments, selectedTenant?.id ?? "none"],
    queryFn: () => getPayments({ tenantId: selectedTenant?.id }),
    enabled: Boolean(selectedTenant?.id) && isHistoryModalVisible,
  });

  const invalidateOperationalQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.payments }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
    ]);
  };

  const updateTenantMutation = useMutation({
    mutationFn: ({ tenantId, payload }: { tenantId: string; payload: Parameters<typeof updateTenant>[1] }) =>
      updateTenant(tenantId, payload),
    onSuccess: async () => {
      setIsEditModalVisible(false);
      setSelectedTenant(null);
      await invalidateOperationalQueries();
    },
  });

  const collectPaymentMutation = useMutation({
    mutationFn: collectRent,
    onSuccess: async () => {
      setIsDepositModalVisible(false);
      setPaymentEditor(null);
      await invalidateOperationalQueries();
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: string; payload: Parameters<typeof updatePayment>[1] }) =>
      updatePayment(paymentId, payload),
    onSuccess: async () => {
      setIsDepositModalVisible(false);
      setPaymentEditor(null);
      await invalidateOperationalQueries();
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.collections.payments, selectedTenant?.id ?? "none"],
      });
    },
  });

  const removeTenantMutation = useMutation({
    mutationFn: ({ tenantId, reason, vacatedOnDate }: { tenantId: string; reason: string; vacatedOnDate?: string }) =>
      removeTenant(tenantId, { reason, vacatedOn: vacatedOnDate }),
    onSuccess: async () => {
      setIsRemoveModalVisible(false);
      setSelectedTenant(null);
      setRemoveReason("");
      setVacatedOn("");
      await invalidateOperationalQueries();
    },
  });

  const propertiesById = useMemo(() => {
    const map = new Map<string, Property>();
    (propertiesQuery.data ?? []).forEach((property) => map.set(property.id, property));
    return map;
  }, [propertiesQuery.data]);

  const tenantList = tenantsQuery.data ?? [];
  const dueCount = tenantList.filter((tenant) => tenant.dueAmount > 0).length;
  const totalDue = tenantList.reduce((sum, tenant) => sum + tenant.dueAmount, 0);

  const canSaveTenant =
    Boolean(selectedTenant?.id) &&
    tenantName.trim().length >= 2 &&
    tenantAddress.trim().length >= 5 &&
    tenantPhone.trim().length >= 8 &&
    Number(tenantRent) >= 0 &&
    Number(tenantRentDay) >= 1 &&
    Number(tenantRentDay) <= 31 &&
    tenantJoinedOn.trim().length > 0 &&
    !updateTenantMutation.isPending;

  const canSavePayment =
    Boolean(selectedTenant?.id) &&
    Number(paymentAmount) > 0 &&
    paymentDate.trim().length > 0 &&
    paymentDueMonth.trim().length === 7 &&
    !collectPaymentMutation.isPending &&
    !updatePaymentMutation.isPending;

  const canRemoveTenant =
    Boolean(selectedTenant?.id) &&
    removeReason.trim().length >= 3 &&
    !removeTenantMutation.isPending;

  const openEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setTenantName(tenant.fullName);
    setTenantAddress(tenant.fullAddress ?? "");
    setTenantPhone(tenant.phone);
    setTenantRent(String(tenant.monthlyRent));
    setTenantRentDay(String(tenant.rentDueDay ?? 1));
    setTenantJoinedOn(toDateInput(tenant.joinedOn));
    setTenantAdvance(String(tenant.advanceAmount ?? 0));
    setTenantOpeningDue(String(tenant.openingDueAmount ?? 0));
    setIsEditModalVisible(true);
  };

  const openDepositModal = (tenant: Tenant) => {
    const now = new Date().toISOString().slice(0, 10);
    setSelectedTenant(tenant);
    setPaymentEditor(null);
    setPaymentAmount(String(Math.max(tenant.dueAmount, 0) || tenant.monthlyRent));
    setPaymentDate(now);
    setPaymentDueMonth(inferDueMonth(now));
    setPaymentMode("UPI");
    setPaymentUtr("");
    setPaymentNotes("");
    setIsDepositModalVisible(true);
  };

  const openHistoryModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsHistoryModalVisible(true);
  };

  const openPaymentEditor = (payment: Payment) => {
    setPaymentEditor(payment);
    setPaymentAmount(String(payment.amount));
    setPaymentDate(toDateInput(payment.paidOn));
    setPaymentDueMonth(payment.dueMonth);
    setPaymentMode(payment.mode);
    setPaymentUtr(payment.utr ?? "");
    setPaymentNotes(payment.notes ?? "");
    setIsHistoryModalVisible(false);
    setIsDepositModalVisible(true);
  };

  const openRemoveModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setRemoveReason("");
    setVacatedOn(new Date().toISOString().slice(0, 10));
    setIsRemoveModalVisible(true);
  };

  if (tenantsQuery.isPending || propertiesQuery.isPending) {
    return (
      <Screen title="Tenant Management" subtitle="People, payments and property occupancy">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (tenantsQuery.isError || propertiesQuery.isError) {
    return (
      <Screen title="Tenant Management" subtitle="People, payments and property occupancy">
        <InfoCard title="Unable to load tenant operations">
          <Text style={styles.error}>
            {getErrorMessage(tenantsQuery.error ?? propertiesQuery.error)}
          </Text>
        </InfoCard>
      </Screen>
    );
  }

  return (
    <Screen
      title="Tenant Management"
      subtitle={`${tenantList.length} tenants | ${dueCount} with dues | ${money(totalDue)} pending`}
    >
      <InfoCard title="Tenant Overview">
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{tenantList.length}</Text>
            <Text style={styles.summaryLabel}>Active Records</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{dueCount}</Text>
            <Text style={styles.summaryLabel}>Need Collection</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{money(totalDue)}</Text>
            <Text style={styles.summaryLabel}>Outstanding</Text>
          </View>
        </View>
      </InfoCard>

      {tenantList.map((tenant) => {
        const property = propertiesById.get(tenant.propertyId);

        return (
          <InfoCard
            key={tenant.id}
            title={tenant.fullName}
            rightNode={
              <Pill
                label={tenant.status.toUpperCase()}
                tone={tenant.status === "active" ? "success" : "warning"}
              />
            }
          >
            <View style={styles.row}>
              <Text style={styles.label}>Property</Text>
              <Text style={styles.value}>{property?.name ?? "Unknown property"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{tenant.phone}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{tenant.fullAddress}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Rent / Due Day</Text>
              <Text style={styles.value}>
                {money(tenant.monthlyRent)} / {tenant.rentDueDay}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Current Due</Text>
              <Text
                style={[
                  styles.value,
                  tenant.dueAmount > 0 ? styles.danger : styles.success,
                ]}
              >
                {money(tenant.dueAmount)}
              </Text>
            </View>
            <View style={styles.actionRow}>
              <Pressable style={styles.primaryButton} onPress={() => openDepositModal(tenant)}>
                <Text style={styles.primaryButtonText}>Deposit</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => openHistoryModal(tenant)}>
                <Text style={styles.secondaryButtonText}>History</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => openEditTenant(tenant)}>
                <Text style={styles.secondaryButtonText}>Edit</Text>
              </Pressable>
            </View>
            <Pressable style={styles.removeButton} onPress={() => openRemoveModal(tenant)}>
              <Text style={styles.removeText}>Remove Tenant</Text>
            </Pressable>
          </InfoCard>
        );
      })}

      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, styles.modalHeaderTitle]}>Edit Tenant</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <TextInput style={styles.input} value={tenantName} onChangeText={setTenantName} placeholder="Tenant name" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={tenantAddress} onChangeText={setTenantAddress} placeholder="Address" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={tenantPhone} onChangeText={setTenantPhone} placeholder="Phone" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
            <TextInput style={styles.input} value={tenantRent} onChangeText={setTenantRent} placeholder="Monthly rent" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <TextInput style={styles.input} value={tenantRentDay} onChangeText={setTenantRentDay} placeholder="Due day" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <DateField
              value={tenantJoinedOn}
              onChange={setTenantJoinedOn}
              placeholder="Joined on"
            />
            <TextInput style={styles.input} value={tenantAdvance} onChangeText={setTenantAdvance} placeholder="Advance amount" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <TextInput style={styles.input} value={tenantOpeningDue} onChangeText={setTenantOpeningDue} placeholder="Opening due amount" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            {updateTenantMutation.isError ? (
              <Text style={styles.error}>{getErrorMessage(updateTenantMutation.error)}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, !canSaveTenant && styles.buttonDisabled]}
                disabled={!canSaveTenant}
                onPress={() => {
                  if (!selectedTenant?.id) return;
                  updateTenantMutation.mutate({
                    tenantId: selectedTenant.id,
                    payload: {
                      fullName: tenantName.trim(),
                      fullAddress: tenantAddress.trim(),
                      phone: tenantPhone.trim(),
                      monthlyRent: Number(tenantRent),
                      rentDueDay: Number(tenantRentDay),
                      joinedOn: tenantJoinedOn.trim(),
                      advanceAmount: Number(tenantAdvance || 0),
                      openingDueAmount: Number(tenantOpeningDue || 0),
                    },
                  });
                }}
              >
                <Text style={styles.primaryButtonText}>
                  {updateTenantMutation.isPending ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isDepositModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDepositModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, styles.modalHeaderTitle]}>
                {paymentEditor ? "Edit Collection" : "Record Collection"}
              </Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsDepositModalVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>{selectedTenant?.fullName ?? ""}</Text>
            <TextInput style={styles.input} value={paymentAmount} onChangeText={setPaymentAmount} placeholder="Amount" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <DateField
              value={paymentDate}
              onChange={(value) => {
                setPaymentDate(value);
                if (!paymentEditor) {
                  setPaymentDueMonth(inferDueMonth(value));
                }
              }}
              placeholder="Paid on"
            />
            <TextInput style={styles.input} value={paymentDueMonth} onChangeText={setPaymentDueMonth} placeholder="Due month YYYY-MM" placeholderTextColor={colors.textMuted} />
            <View style={styles.modeRow}>
              {paymentModes.map((mode) => (
                <Pressable
                  key={mode}
                  style={[styles.modeChip, paymentMode === mode && styles.modeChipActive]}
                  onPress={() => setPaymentMode(mode)}
                >
                  <Text style={[styles.modeChipText, paymentMode === mode && styles.modeChipTextActive]}>
                    {mode}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={styles.input} value={paymentUtr} onChangeText={setPaymentUtr} placeholder="UTR or reference" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={paymentNotes} onChangeText={setPaymentNotes} placeholder="Notes" placeholderTextColor={colors.textMuted} />
            {collectPaymentMutation.isError || updatePaymentMutation.isError ? (
              <Text style={styles.error}>
                {getErrorMessage(collectPaymentMutation.error ?? updatePaymentMutation.error)}
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsDepositModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, !canSavePayment && styles.buttonDisabled]}
                disabled={!canSavePayment}
                onPress={() => {
                  if (!selectedTenant?.id) return;
                  if (paymentEditor?.id) {
                    updatePaymentMutation.mutate({
                      paymentId: paymentEditor.id,
                      payload: {
                        amount: Number(paymentAmount),
                        paidOn: paymentDate,
                        dueMonth: paymentDueMonth,
                        mode: paymentMode,
                        utr: paymentUtr.trim() || undefined,
                        notes: paymentNotes.trim() || undefined,
                      },
                    });
                    return;
                  }

                  collectPaymentMutation.mutate({
                    tenantId: selectedTenant.id,
                    amount: Number(paymentAmount),
                    paidOn: paymentDate,
                    dueMonth: paymentDueMonth,
                    mode: paymentMode,
                    utr: paymentUtr.trim() || undefined,
                    notes: paymentNotes.trim() || undefined,
                  });
                }}
              >
                <Text style={styles.primaryButtonText}>
                  {collectPaymentMutation.isPending || updatePaymentMutation.isPending
                    ? "Saving..."
                    : paymentEditor
                      ? "Update"
                      : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isHistoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsHistoryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.historyModal]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, styles.modalHeaderTitle]}>Payment History</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsHistoryModalVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>{selectedTenant?.fullName ?? ""}</Text>
            {paymentsQuery.isPending ? <ActivityIndicator color={colors.primary} /> : null}
            <ScrollView showsVerticalScrollIndicator={false}>
              {(paymentsQuery.data ?? []).map((payment) => (
                <Pressable
                  key={payment.id}
                  style={styles.historyItem}
                  onPress={() => openPaymentEditor(payment)}
                >
                  <View style={styles.flexOne}>
                    <Text style={styles.historyTitle}>{money(payment.amount)}</Text>
                    <Text style={styles.historyMeta}>
                      {payment.paidOn.slice(0, 10)} | Due {payment.dueMonth} | {payment.mode}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {payment.receiptNo ?? payment.id}
                    </Text>
                  </View>
                  <Pill label="Edit" />
                </Pressable>
              ))}
              {!paymentsQuery.isPending && (paymentsQuery.data ?? []).length === 0 ? (
                <Text style={styles.emptyText}>No transactions recorded yet.</Text>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsHistoryModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isRemoveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRemoveModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, styles.modalHeaderTitle]}>Remove Tenant</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsRemoveModalVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>
              This keeps history, payment records and property timeline intact.
            </Text>
            <TextInput style={styles.input} value={removeReason} onChangeText={setRemoveReason} placeholder="Reason for vacating" placeholderTextColor={colors.textMuted} />
            <DateField
              value={vacatedOn}
              onChange={setVacatedOn}
              placeholder="Vacated on"
            />
            {removeTenantMutation.isError ? (
              <Text style={styles.error}>{getErrorMessage(removeTenantMutation.error)}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsRemoveModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.removeButtonInline, !canRemoveTenant && styles.buttonDisabled]}
                disabled={!canRemoveTenant}
                onPress={() => {
                  if (!selectedTenant?.id) return;
                  removeTenantMutation.mutate({
                    tenantId: selectedTenant.id,
                    reason: removeReason.trim(),
                    vacatedOnDate: vacatedOn.trim() || undefined,
                  });
                }}
              >
                <Text style={styles.removeText}>
                  {removeTenantMutation.isPending ? "Removing..." : "Confirm Remove"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    gap: 4,
  },
  summaryValue: {
    fontSize: 18,
    color: colors.textPrimary,
    fontFamily: fonts.display,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.heading,
    flexShrink: 1,
    textAlign: "right",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
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
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  removeButton: {
    marginTop: 8,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: "#FFF3F3",
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonInline: {
    flex: 1,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: "#FFF3F3",
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  removeText: {
    color: colors.danger,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  danger: {
    color: colors.danger,
  },
  success: {
    color: colors.success,
  },
  error: {
    color: colors.warning,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7,16,37,0.45)",
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
    maxHeight: "88%",
  },
  historyModal: {
    minHeight: "55%",
  },
  modalTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  modalHeaderTitle: {
    flex: 1,
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
  modalMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
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
    justifyContent: "flex-end",
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceAlt,
  },
  modeChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  modeChipText: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  modeChipTextActive: {
    color: colors.primaryDark,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.surfaceAlt,
  },
  flexOne: {
    flex: 1,
  },
  historyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  historyMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
    paddingVertical: 10,
  },
});
