import React, { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "../components/Screen";
import { Pill } from "../components/Pill";
import { DateField } from "../components/DateField";
import { useAuth } from "../store/AuthContext";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { Tenant, Property, Payment } from "../types/models";
import { AppStackParamList } from "../navigation/AppStackNavigator";
import {
  collectRent,
  getPayments,
  updatePayment,
} from "../services/api/collectionService";
import { queryKeys } from "../services/api/queryKeys";
import {
  removeTenant,
  updateTenant,
} from "../services/api/tenantService";

type Props = {
  route: {
    params: {
      tenant: Tenant;
      property: Property;
    };
  };
};

const money = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

type PaymentMode = NonNullable<Payment["mode"]>;

const paymentModes: PaymentMode[] = ["UPI", "CASH", "BANK_TRANSFER", "CARD"];

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

export function TenantDetailsScreen({ route }: Props) {
  const { colors, fonts, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { tenant: initialTenant, property } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [tenant, setTenant] = useState(initialTenant);

  // Modals state
  const [isDepositModalVisible, setIsDepositModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentDueMonth, setPaymentDueMonth] = useState("");
  const [paymentUtr, setPaymentUtr] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [paymentEditor, setPaymentEditor] = useState<Payment | null>(null);

  // Edit tenant form state
  const [tenantName, setTenantName] = useState(tenant.fullName);
  const [tenantAddress, setTenantAddress] = useState(tenant.fullAddress ?? "");
  const [tenantPhone, setTenantPhone] = useState(tenant.phone);
  const [tenantRent, setTenantRent] = useState(String(tenant.monthlyRent));
  const [tenantRentDay, setTenantRentDay] = useState(String(tenant.rentDueDay ?? 1));
  const [tenantJoinedOn, setTenantJoinedOn] = useState(toDateInput(tenant.joinedOn));
  const [tenantAdvance, setTenantAdvance] = useState(String(tenant.advanceAmount ?? 0));
  const [tenantOpeningDue, setTenantOpeningDue] = useState(String(tenant.openingDueAmount ?? 0));

  // Remove tenant form state
  const [removeReason, setRemoveReason] = useState("");
  const [vacatedOn, setVacatedOn] = useState("");

  const paymentsQuery = useQuery({
    queryKey: [...queryKeys.collections.payments, tenant.id],
    queryFn: () => getPayments({ tenantId: tenant.id }),
    enabled: isHistoryModalVisible,
  });

  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.payments }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary, refetchType: "all" }),
    ]);
  };

  const collectPaymentMutation = useMutation({
    mutationFn: collectRent,
    onSuccess: async () => {
      setIsDepositModalVisible(false);
      setPaymentEditor(null);
      await invalidateQueries();
      // Refresh tenant data
      const updatedTenant = { ...tenant, dueAmount: Math.max(0, tenant.dueAmount - Number(paymentAmount)) };
      setTenant(updatedTenant);
      resetPaymentForm();
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: string; payload: Parameters<typeof updatePayment>[1] }) =>
      updatePayment(paymentId, payload),
    onSuccess: async () => {
      setIsDepositModalVisible(false);
      setPaymentEditor(null);
      await invalidateQueries();
      resetPaymentForm();
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: ({ tenantId, payload }: { tenantId: string; payload: Parameters<typeof updateTenant>[1] }) =>
      updateTenant(tenantId, payload),
    onSuccess: async (data) => {
      setIsEditModalVisible(false);
      await invalidateQueries();
      setTenant({ ...tenant, ...data });
    },
  });

  const removeTenantMutation = useMutation({
    mutationFn: ({ tenantId, reason, vacatedOnDate }: { tenantId: string; reason: string; vacatedOnDate?: string }) =>
      removeTenant(tenantId, { reason, vacatedOn: vacatedOnDate }),
    onSuccess: async () => {
      setIsRemoveModalVisible(false);
      await invalidateQueries();
      navigation.goBack();
    },
  });

  const resetPaymentForm = () => {
    setPaymentAmount("");
    setPaymentDate("");
    setPaymentDueMonth("");
    setPaymentUtr("");
    setPaymentNotes("");
    setPaymentMode("UPI");
    setPaymentEditor(null);
  };

  const openDepositModal = () => {
    const now = new Date().toISOString().slice(0, 10);
    setPaymentEditor(null);
    setPaymentAmount(String(Math.max(tenant.dueAmount, 0) || tenant.monthlyRent));
    setPaymentDate(now);
    setPaymentDueMonth(inferDueMonth(now));
    setPaymentMode("UPI");
    setPaymentUtr("");
    setPaymentNotes("");
    setIsDepositModalVisible(true);
  };

  const openHistoryModal = () => {
    setIsHistoryModalVisible(true);
  };

  const openEditModal = () => {
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

  const openRemoveModal = () => {
    setRemoveReason("");
    setVacatedOn(new Date().toISOString().slice(0, 10));
    setIsRemoveModalVisible(true);
  };

  const openPaymentEditor = (payment: Payment) => {
    setPaymentEditor(payment);
    setPaymentAmount(String(payment.amount));
    setPaymentDate(toDateInput(payment.paidOn));
    setPaymentDueMonth(payment.dueMonth);
    setPaymentMode(payment.mode ?? "UPI");
    setPaymentUtr(payment.utr ?? "");
    setPaymentNotes(payment.notes ?? "");
    setIsHistoryModalVisible(false);
    setIsDepositModalVisible(true);
  };

  const canSavePayment =
    Number(paymentAmount) > 0 &&
    paymentDate.trim().length > 0 &&
    paymentDueMonth.trim().length === 7 &&
    !collectPaymentMutation.isPending &&
    !updatePaymentMutation.isPending;

  const canSaveTenant =
    tenantName.trim().length >= 2 &&
    tenantAddress.trim().length >= 5 &&
    tenantPhone.trim().length >= 8 &&
    Number(tenantRent) >= 0 &&
    Number(tenantRentDay) >= 1 &&
    Number(tenantRentDay) <= 31 &&
    tenantJoinedOn.trim().length > 0 &&
    !updateTenantMutation.isPending;

  const canRemoveTenant =
    removeReason.trim().length >= 3 &&
    !removeTenantMutation.isPending;

  return (
    <Screen title="Tenant Details" subtitle={tenant.fullName}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.tenantName}>{tenant.fullName}</Text>
          <Pill
            label={tenant.status.toUpperCase()}
            tone={tenant.status === "active" ? "success" : "warning"}
          />
        </View>

        <View style={styles.card}>
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
            <Text style={styles.value}>{tenant.fullAddress ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rent / Due Day</Text>
            <Text style={styles.value}>
              {money(tenant.monthlyRent)} / {tenant.rentDueDay ?? 1}
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
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.primaryButton} onPress={openDepositModal}>
            <Text style={styles.primaryButtonText}>Deposit</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={openHistoryModal}>
            <Text style={styles.secondaryButtonText}>History</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={openEditModal}>
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </Pressable>
        </View>

        <Pressable style={styles.removeButton} onPress={openRemoveModal}>
          <Text style={styles.removeText}>Remove Tenant</Text>
        </Pressable>
      </ScrollView>

      {/* Deposit Modal */}
      <Modal visible={isDepositModalVisible} transparent animationType="slide" onRequestClose={() => setIsDepositModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{paymentEditor ? "Edit Collection" : "Record Collection"}</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsDepositModalVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>{tenant.fullName}</Text>
            <TextInput style={styles.input} value={paymentAmount} onChangeText={setPaymentAmount} placeholder="Amount" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <DateField value={paymentDate} onChange={(v) => { setPaymentDate(v); setPaymentDueMonth(inferDueMonth(v)); }} placeholder="Paid on" />
            <TextInput style={styles.input} value={paymentDueMonth} onChangeText={setPaymentDueMonth} placeholder="Due month (YYYY-MM)" placeholderTextColor={colors.textMuted} />
            <View style={styles.modeRow}>
              {paymentModes.map((mode) => (
                <Pressable key={mode} style={[styles.modeChip, paymentMode === mode && styles.modeChipActive]} onPress={() => setPaymentMode(mode)}>
                  <Text style={[styles.modeChipText, paymentMode === mode && styles.modeChipTextActive]}>{mode.replace("_", " ")}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={styles.input} value={paymentUtr} onChangeText={setPaymentUtr} placeholder="UTR / Reference (optional)" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={paymentNotes} onChangeText={setPaymentNotes} placeholder="Notes (optional)" placeholderTextColor={colors.textMuted} />
            {(collectPaymentMutation.isError || updatePaymentMutation.isError) ? <Text style={styles.error}>{getErrorMessage(collectPaymentMutation.error ?? updatePaymentMutation.error)}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsDepositModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, !canSavePayment && styles.buttonDisabled]}
                disabled={!canSavePayment}
                onPress={() => {
                  if (paymentEditor) {
                    updatePaymentMutation.mutate({
                      paymentId: paymentEditor.id,
                      payload: { amount: Number(paymentAmount), paidOn: paymentDate.trim(), dueMonth: paymentDueMonth.trim(), mode: paymentMode, utr: paymentUtr.trim() || undefined, notes: paymentNotes.trim() || undefined },
                    });
                  } else {
                    collectPaymentMutation.mutate({ tenantId: tenant.id, amount: Number(paymentAmount), paidOn: paymentDate.trim(), dueMonth: paymentDueMonth.trim(), mode: paymentMode, utr: paymentUtr.trim() || undefined, notes: paymentNotes.trim() || undefined });
                  }
                }}
              >
                <Text style={styles.primaryButtonText}>{(collectPaymentMutation.isPending || updatePaymentMutation.isPending) ? "Saving..." : paymentEditor ? "Update" : "Record"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={isHistoryModalVisible} transparent animationType="slide" onRequestClose={() => setIsHistoryModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.largeModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment History</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsHistoryModalVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>{tenant.fullName}</Text>
            {paymentsQuery.isPending ? <ActivityIndicator color={colors.primary} /> : null}
            <ScrollView style={styles.historyList}>
              {(paymentsQuery.data ?? []).length === 0 ? <Text style={styles.emptyText}>No payments recorded yet.</Text> : null}
              {(paymentsQuery.data ?? []).map((payment) => (
                <View key={payment.id} style={styles.historyRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.historyMonth}>{payment.dueMonth}</Text>
                    <Text style={styles.historyDate}>Paid on {payment.paidOn.slice(0, 10)} • {payment.mode.replace("_", " ")}</Text>
                    {payment.utr ? <Text style={styles.historyRef}>Ref: {payment.utr}</Text> : null}
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>{money(payment.amount)}</Text>
                    <Pressable style={styles.historyEdit} onPress={() => openPaymentEditor(payment)}>
                      <Text style={styles.historyEditText}>Edit</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={isEditModalVisible} transparent animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Tenant</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <TextInput style={styles.input} value={tenantName} onChangeText={setTenantName} placeholder="Tenant name" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={tenantAddress} onChangeText={setTenantAddress} placeholder="Address" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={tenantPhone} onChangeText={setTenantPhone} placeholder="Phone" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
            <TextInput style={styles.input} value={tenantRent} onChangeText={setTenantRent} placeholder="Monthly rent" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <TextInput style={styles.input} value={tenantRentDay} onChangeText={setTenantRentDay} placeholder="Due day" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <DateField value={tenantJoinedOn} onChange={setTenantJoinedOn} placeholder="Joined on" />
            <TextInput style={styles.input} value={tenantAdvance} onChangeText={setTenantAdvance} placeholder="Advance amount" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <TextInput style={styles.input} value={tenantOpeningDue} onChangeText={setTenantOpeningDue} placeholder="Opening due amount" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            {updateTenantMutation.isError ? <Text style={styles.error}>{getErrorMessage(updateTenantMutation.error)}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, !canSaveTenant && styles.buttonDisabled]}
                disabled={!canSaveTenant}
                onPress={() => {
                  updateTenantMutation.mutate({
                    tenantId: tenant.id,
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
                <Text style={styles.primaryButtonText}>{updateTenantMutation.isPending ? "Saving..." : "Save"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Remove Modal */}
      <Modal visible={isRemoveModalVisible} transparent animationType="slide" onRequestClose={() => setIsRemoveModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove Tenant</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsRemoveModalVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>{tenant.fullName}</Text>
            <TextInput style={styles.input} value={removeReason} onChangeText={setRemoveReason} placeholder="Reason for removal" placeholderTextColor={colors.textMuted} />
            <DateField value={vacatedOn} onChange={setVacatedOn} placeholder="Vacated on" />
            {removeTenantMutation.isError ? <Text style={styles.error}>{getErrorMessage(removeTenantMutation.error)}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsRemoveModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.dangerButton, !canRemoveTenant && styles.buttonDisabled]}
                disabled={!canRemoveTenant}
                onPress={() => { removeTenantMutation.mutate({ tenantId: tenant.id, reason: removeReason.trim(), vacatedOnDate: vacatedOn.trim() || undefined }); }}
              >
                <Text style={styles.dangerButtonText}>{removeTenantMutation.isPending ? "Removing..." : "Remove Tenant"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  tenantName: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  value: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  danger: {
    color: colors.danger,
  },
  success: {
    color: colors.success,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.button,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  removeButton: {
    marginHorizontal: 12,
    backgroundColor: "#FFF5F5",
    borderRadius: radii.button,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  removeText: {
    color: colors.danger,
    fontFamily: fonts.heading,
    fontSize: 14,
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
    maxHeight: "88%",
  },
  largeModal: {
    minHeight: "58%",
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
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeChipText: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  modeChipTextActive: {
    color: "#FFFFFF",
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  historyList: {
    maxHeight: 300,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  flexOne: {
    flex: 1,
  },
  historyMonth: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  historyDate: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  historyRef: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyAmount: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  historyEdit: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
  },
  historyEditText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 11,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  dangerButton: {
    borderRadius: radii.button,
    backgroundColor: colors.danger,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    flex: 1,
  },
  dangerButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 14,
  },
});
