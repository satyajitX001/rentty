import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "../components/Screen";
import { Pill } from "../components/Pill";
import { DateField } from "../components/DateField";
import { FloatingLabelInput } from "../components/FloatingLabelInput";
import { useAuth } from "../store/AuthContext";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { Tenant, Property, Payment, CollectPaymentResponse, LedgerEntryType } from "../types/models";
import { AppStackParamList } from "../navigation/AppStackNavigator";
import { formatDate } from "../utils/date";
import {
  collectRent,
  getPayments,
  updatePayment,
} from "../services/api/collectionService";
import { queryKeys } from "../services/api/queryKeys";
import {
  removeTenant,
  updateTenant,
  calculateSettlement,
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
  const [isSettlementModalVisible, setIsSettlementModalVisible] = useState(false);
  const [settlementData, setSettlementData] = useState<import("../types/models").SettlementResult | null>(null);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentUtr, setPaymentUtr] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [paymentEditor, setPaymentEditor] = useState<Payment | null>(null);
  const [useCreditAutomatically, setUseCreditAutomatically] = useState(true);

  // Edit tenant form state
  const [tenantName, setTenantName] = useState(tenant.fullName);
  const [tenantAddress, setTenantAddress] = useState(tenant.fullAddress ?? "");
  const [tenantPhone, setTenantPhone] = useState(tenant.phone);
  const [tenantRent, setTenantRent] = useState(String(tenant.monthlyRent));
  const [tenantRentDay, setTenantRentDay] = useState(String(tenant.rentDueDay ?? 1));
  const [tenantJoinedOn, setTenantJoinedOn] = useState(toDateInput(tenant.joinedOn));
  const [tenantSecurityDeposit, setTenantSecurityDeposit] = useState(String(tenant.securityDeposit ?? tenant.advanceAmount ?? 0));
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
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.list, exact: true }),
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.payments, exact: true }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary, exact: true }),
    ]);
  };

  const collectPaymentMutation = useMutation({
    mutationFn: collectRent,
    onSuccess: async (response: CollectPaymentResponse) => {
      setIsDepositModalVisible(false);
      setPaymentEditor(null);
      await invalidateQueries();
      // Use backend's allocation response for accurate optimistic update
      if (response.allocations && response.receipt) {
        const updatedTenant = {
          ...tenant,
          dueAmount: response.receipt.balanceDue,
          creditBalance: response.receipt.creditBalance,
        };
        setTenant(updatedTenant);
      }
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

  const fetchSettlement = async () => {
    try {
      const result = await calculateSettlement(tenant.id, vacatedOn.trim() || new Date().toISOString().slice(0, 10));
      setSettlementData(result);
      setIsSettlementModalVisible(true);
    } catch (error) {
      // Error handled by modal
    }
  };

  const resetPaymentForm = () => {
    setPaymentAmount("");
    setPaymentDate("");
    setPaymentUtr("");
    setPaymentMode("UPI");
    setPaymentEditor(null);
    setUseCreditAutomatically(true);
  };

  const openDepositModal = () => {
    const now = new Date().toISOString().slice(0, 10);
    setPaymentEditor(null);
    setPaymentAmount(String(Math.max(tenant.dueAmount, 0) || tenant.monthlyRent));
    setPaymentDate(now);
    setPaymentMode("UPI");
    setPaymentUtr("");
    setUseCreditAutomatically(true);
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
    setTenantSecurityDeposit(String(tenant.securityDeposit ?? tenant.advanceAmount ?? 0));
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
    setPaymentMode(payment.mode ?? "UPI");
    setPaymentUtr(payment.notes ?? payment.utr ?? "");
    setIsHistoryModalVisible(false);
    setIsDepositModalVisible(true);
  };

  const canSavePayment =
    Number(paymentAmount) > 0 &&
    paymentDate.trim().length > 0 &&
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

        {/* Financial Summary Card */}
        <View style={styles.financialCard}>
          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Monthly Rent</Text>
              <Text style={styles.financialValue}>{money(tenant.monthlyRent)}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Outstanding Due</Text>
              <Text style={[styles.financialValue, tenant.dueAmount > 0 ? styles.danger : styles.success]}>
                {money(tenant.dueAmount)}
              </Text>
            </View>
          </View>
          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Available Credit</Text>
              <Text style={[styles.financialValue, styles.credit]}>{money(tenant.creditBalance ?? 0)}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Deposit Held</Text>
              <Text style={styles.financialValue}>{money(tenant.advanceAmount ?? 0)}</Text>
            </View>
          </View>
          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Opening Balance</Text>
              <Text style={styles.financialValue}>{money(tenant.openingDueAmount ?? 0)}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Next Due Date</Text>
              <Text style={styles.financialValue}>{tenant.joinedOn ? formatDate(tenant.joinedOn) : "-"}</Text>
            </View>
          </View>
          {tenant.rentDueDay && property.graceDays ? (
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Grace Ends On</Text>
                <Text style={styles.financialValue}>
                  {(() => {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = today.getMonth();
                    const dueDay = Math.min(tenant.rentDueDay!, new Date(year, month + 1, 0).getDate());
                    const dueDate = new Date(year, month, dueDay);
                    const graceEnd = new Date(dueDate);
                    graceEnd.setDate(graceEnd.getDate() + (property.graceDays ?? 0));
                    return formatDate(graceEnd.toISOString());
                  })()}
                </Text>
              </View>
            </View>
          ) : null}
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
        </View>

        <View style={styles.actionRow}>
          <Pressable style={[styles.primaryButton, styles.dangerButton]} onPress={openRemoveModal}>
            <Text style={styles.primaryButtonText}>Remove Tenant</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={openHistoryModal}>
            <Text style={styles.secondaryButtonText}>History</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={openEditModal}>
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.primaryButton, styles.fullWidthButton]} onPress={openDepositModal}>
          <Text style={styles.primaryButtonText}>Record Collection</Text>
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
            <FloatingLabelInput label="Amount" value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="numeric" required />
            <DateField value={paymentDate} onChange={setPaymentDate} placeholder="Paid on" label="Paid on" />
            <View style={styles.modeRow}>
              {paymentModes.map((mode) => (
                <Pressable key={mode} style={[styles.modeChip, paymentMode === mode && styles.modeChipActive]} onPress={() => setPaymentMode(mode)}>
                  <Text style={[styles.modeChipText, paymentMode === mode && styles.modeChipTextActive]}>{mode.replace("_", " ")}</Text>
                </Pressable>
              ))}
            </View>
            <FloatingLabelInput label="Reference / notes" value={paymentUtr} onChangeText={setPaymentUtr} multiline hint="Add a UTR, reference, or any helpful note" />
            {(collectPaymentMutation.isError || updatePaymentMutation.isError) ? <Text style={styles.error}>{getErrorMessage(collectPaymentMutation.error ?? updatePaymentMutation.error)}</Text> : null}
            {!paymentEditor && (tenant.creditBalance ?? 0) > 0 && tenant.dueAmount > 0 ? (
              <View style={styles.creditOptionRow}>
                <Pressable onPress={() => setUseCreditAutomatically(!useCreditAutomatically)} style={styles.creditCheckbox}>
                  <Text style={[styles.creditCheckboxText, useCreditAutomatically && styles.creditCheckboxTextActive]}>✓</Text>
                </Pressable>
                <Text style={styles.creditOptionLabel}>Use Available Credit Automatically (Credit: {money(tenant.creditBalance ?? 0)})</Text>
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.primaryButton, styles.fullWidthButton, !canSavePayment && styles.buttonDisabled]}
                disabled={!canSavePayment}
                onPress={() => {
                  if (paymentEditor) {
                    updatePaymentMutation.mutate({
                      paymentId: paymentEditor.id,
                      payload: { amount: Number(paymentAmount), paidOn: paymentDate.trim(), mode: paymentMode, notes: paymentUtr.trim() || undefined },
                    });
                  } else {
                    collectPaymentMutation.mutate({
                      tenantId: tenant.id,
                      amount: Number(paymentAmount),
                      paidOn: paymentDate.trim(),
                      mode: paymentMode,
                      notes: paymentUtr.trim() || undefined
                    });
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
                    <Text style={styles.historyMonth}>{money(payment.amount)}</Text>
                    <Text style={styles.historyDate}>Paid on {formatDate(payment.paidOn)} • {payment.mode.replace("_", " ")}</Text>
                    {payment.utr || payment.notes ? <Text style={styles.historyRef}>{payment.notes ?? payment.utr}</Text> : null}
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
            <Text style={styles.modalMeta}>Update contact, rent, and deposit details. Changes are saved to this tenant only.</Text>
            <FloatingLabelInput label="Tenant name" value={tenantName} onChangeText={setTenantName} required />
            <FloatingLabelInput label="Residential address" value={tenantAddress} onChangeText={setTenantAddress} multiline required />
            <FloatingLabelInput label="Mobile number" value={tenantPhone} onChangeText={setTenantPhone} keyboardType="phone-pad" required />
            <FloatingLabelInput label="Monthly rent" value={tenantRent} onChangeText={setTenantRent} keyboardType="numeric" required />
            <FloatingLabelInput label="Rent due day" value={tenantRentDay} onChangeText={setTenantRentDay} keyboardType="numeric" hint="1–31" required />
            <DateField value={tenantJoinedOn} onChange={setTenantJoinedOn} placeholder="Joined on" label="Joined on" />
            <FloatingLabelInput label="Advance amount" value={tenantAdvance} onChangeText={setTenantAdvance} keyboardType="numeric" />
            <FloatingLabelInput label="Opening due amount" value={tenantOpeningDue} onChangeText={setTenantOpeningDue} keyboardType="numeric" />
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
                      securityDeposit: Number(tenantSecurityDeposit || 0),
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
            {(tenant.creditBalance ?? 0) > 0 ? (
              <View style={styles.refundInfo}>
                <Text style={styles.refundLabel}>Credit Balance to Refund:</Text>
                <Text style={styles.refundAmount}>+ {money(tenant.creditBalance ?? 0)}</Text>
              </View>
            ) : null}
            <Pressable style={styles.settlementPreviewButton} onPress={fetchSettlement}>
              <Text style={styles.settlementPreviewText}>Preview Settlement</Text>
            </Pressable>
            <FloatingLabelInput label="Reason for removal" value={removeReason} onChangeText={setRemoveReason} required />
            <DateField value={vacatedOn} onChange={setVacatedOn} placeholder="Vacated on" label="Vacated on" />
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

      {/* Settlement Preview Modal */}
      <Modal visible={isSettlementModalVisible} transparent animationType="slide" onRequestClose={() => setIsSettlementModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.largeModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settlement Preview</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsSettlementModalVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>{tenant.fullName}</Text>
            {settlementData ? (
              <View style={styles.settlementContent}>
                <View style={styles.settlementRow}>
                  <Text style={styles.settlementLabel}>Outstanding Rent</Text>
                  <Text style={styles.settlementValue}>{money(settlementData.outstandingRent)}</Text>
                </View>
                <View style={styles.settlementRow}>
                  <Text style={styles.settlementLabel}>Deposit Held</Text>
                  <Text style={styles.settlementValue}>{money(settlementData.depositHeld)}</Text>
                </View>
                <View style={styles.settlementRow}>
                  <Text style={styles.settlementLabel}>Credit Balance</Text>
                  <Text style={[styles.settlementValue, styles.credit]}>+ {money(settlementData.creditBalance)}</Text>
                </View>
                <View style={styles.settlementRow}>
                  <Text style={styles.settlementLabel}>Maintenance Charges</Text>
                  <Text style={styles.settlementValue}>{money(settlementData.maintenanceCharges)}</Text>
                </View>
                <View style={styles.settlementRow}>
                  <Text style={styles.settlementLabel}>Damage Charges</Text>
                  <Text style={styles.settlementValue}>{money(settlementData.damageCharges)}</Text>
                </View>
                <View style={[styles.settlementRow, styles.settlementTotal]}>
                  <Text style={styles.settlementLabel}>Refund Amount</Text>
                  <Text style={[styles.settlementValue, settlementData.refundAmount >= 0 ? styles.success : styles.danger]}>
                    {money(settlementData.refundAmount)}
                  </Text>
                </View>
                {settlementData.settlementDetails && settlementData.settlementDetails.length > 0 ? (
                  <View style={styles.settlementDetails}>
                    <Text style={styles.settlementDetailTitle}>Breakdown:</Text>
                    {settlementData.settlementDetails.map((detail, idx) => (
                      <View key={idx} style={styles.settlementDetailRow}>
                        <Text style={styles.settlementDetailLabel}>{detail.description}</Text>
                        <Text style={[styles.settlementDetailValue, detail.amount >= 0 ? styles.success : styles.danger]}>
                          {money(detail.amount)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <ActivityIndicator color={colors.primary} />
            )}
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsSettlementModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Close</Text>
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
  financialCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 16,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  financialItem: {
    flex: 1,
    marginRight: 8,
  },
  financialLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  financialValue: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.textPrimary,
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
  credit: {
    color: colors.success,
  },
  refundInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.success + "15",
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.success,
    marginBottom: 8,
  },
  refundLabel: {
    color: colors.success,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  refundAmount: {
    color: colors.success,
    fontFamily: fonts.display,
    fontSize: 16,
  },
  actionRow: {
    flexDirection: "row",
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
  fullWidthButton: {
    width: "100%",
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
  notesInput: {
    minHeight: 92,
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: -4,
    marginLeft: -4,
    marginRight: -4,
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
  creditOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.success + "15",
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.success,
    marginBottom: 8,
  },
  creditCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  creditCheckboxText: {
    color: "transparent",
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  creditCheckboxTextActive: {
    color: colors.success,
  },
  creditOptionLabel: {
    color: colors.success,
    fontFamily: fonts.body,
    fontSize: 12,
    flex: 1,
  },
  settlementPreviewButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.button,
    marginBottom: 8,
  },
  settlementPreviewText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  settlementContent: {
    marginTop: 8,
  },
  settlementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settlementTotal: {
    borderTopWidth: 2,
    borderTopColor: colors.border,
    marginTop: 4,
    paddingTop: 10,
  },
  settlementLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  settlementValue: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  settlementDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  settlementDetailTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 12,
    marginBottom: 4,
  },
  settlementDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  settlementDetailLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  settlementDetailValue: {
    color: colors.textPrimary,
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
