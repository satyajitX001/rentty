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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
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
import { AppStackParamList } from "../navigation/AppStackNavigator";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { scale, verticalScale, moderateScale } from "../utils/scale";
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
  const { colors, fonts, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const tenantsQuery = useQuery({ queryKey: queryKeys.tenants.list, queryFn: () => getTenants() });
  const propertiesQuery = useQuery({ queryKey: queryKeys.properties.list, queryFn: getProperties });

  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);

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

  const properties = propertiesQuery.data ?? [];
  const allTenants = tenantsQuery.data ?? [];

  const tenantsByProperty = useMemo(() => {
    const map = new Map<string, Tenant[]>();
    properties.forEach((property) => {
      map.set(property.id, []);
    });

    allTenants.forEach((tenant) => {
      const existing = map.get(tenant.propertyId);
      if (existing) {
        existing.push(tenant);
      }
    });

    return map;
  }, [allTenants, properties]);

  const totalTenantCount = allTenants.length;
  const dueCount = allTenants.filter((tenant) => tenant.dueAmount > 0).length;
  const totalDue = allTenants.reduce((sum, tenant) => sum + tenant.dueAmount, 0);

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

  const navigateToTenantDetails = (tenant: Tenant) => {
    const property = propertiesById.get(tenant.propertyId);
    if (property) {
      navigation.navigate("TenantDetails", { tenant, property });
    }
  };

  if (tenantsQuery.isPending || propertiesQuery.isPending) {
    return (
      <Screen title="Tenant Management" subtitle="People, payments and property occupancy" showHeader={false}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (tenantsQuery.isError || propertiesQuery.isError) {
    return (
      <Screen title="Tenant Management" subtitle="People, payments and property occupancy" showHeader={false}>
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
      subtitle={`${totalTenantCount} tenants | ${dueCount} with dues | ${money(totalDue)} pending`}
      showHeader={false}
    >
      {properties.length === 0 ? (
        <InfoCard title="No Properties Found">
          <Text style={styles.emptyText}>Add a property first to view associated tenants.</Text>
        </InfoCard>
      ) : (
        <View style={styles.accordionList}>
          {properties.map((property) => {
            const propertyTenants = tenantsByProperty.get(property.id) ?? [];
            const isOpen = expandedPropertyId === property.id;
            const propertyDue = propertyTenants.reduce((sum, tenant) => sum + tenant.dueAmount, 0);

            return (
              <View key={property.id} style={styles.accordionSection}>
                <Pressable
                  style={styles.accordionHeader}
                  onPress={() =>
                    setExpandedPropertyId((current) => (current === property.id ? null : property.id))
                  }
                >
                  <View style={styles.flexOne}>
                    <Text style={styles.accordionTitle}>{property.name}</Text>
                    <Text style={styles.accordionMeta}>
                      {propertyTenants.length} tenants | Due {money(propertyDue)}
                    </Text>
                  </View>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>

                {isOpen ? (
                  <View style={styles.accordionBody}>
                    {propertyTenants.length === 0 ? (
                      <Text style={styles.emptyText}>No tenants assigned to this property yet.</Text>
                    ) : (
                      propertyTenants.map((tenant) => (
                        <View key={tenant.id} style={styles.tenantCard}>
                          <View style={styles.tenantHeader}>
                            <View style={styles.tenantInfo}>
                              <Text style={styles.tenantName}>{tenant.fullName}</Text>
                              <Text style={[styles.tenantDue, tenant.dueAmount > 0 ? styles.danger : styles.success]}>
                                Current Due: {money(tenant.dueAmount)}
                              </Text>
                            </View>
                            <Pill
                              label={tenant.status.toUpperCase()}
                              tone={tenant.status === "active" ? "success" : "warning"}
                            />
                          </View>
                          <Pressable
                            style={styles.moreDetailsButton}
                            onPress={() => navigateToTenantDetails(tenant)}
                          >
                            <Text style={styles.moreDetailsText}>More Details</Text>
                          </Pressable>
                        </View>
                      ))
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

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

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) => StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale(10),
  },
  summaryItem: {
    flex: 1,
    borderRadius: moderateScale(16),
    backgroundColor: colors.surfaceAlt,
    padding: moderateScale(12),
    gap: scale(4),
  },
  summaryValue: {
    fontSize: moderateScale(18),
    color: colors.textPrimary,
    fontFamily: fonts.display,
  },
  summaryLabel: {
    fontSize: moderateScale(11),
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: scale(10),
    paddingVertical: verticalScale(2),
  },
  label: {
    color: colors.textMuted,
    fontSize: moderateScale(12),
    fontFamily: fonts.body,
  },
  value: {
    color: colors.textPrimary,
    fontSize: moderateScale(13),
    fontFamily: fonts.heading,
    flexShrink: 1,
    textAlign: "right",
  },
  actionRow: {
    flexDirection: "row",
    gap: scale(8),
    marginTop: verticalScale(6),
  },
  primaryButton: {
    flex: 1,
    borderRadius: moderateScale(radii.button),
    backgroundColor: colors.primary,
    minHeight: verticalScale(42),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(12),
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: moderateScale(13),
  },
  secondaryButton: {
    flex: 1,
    borderRadius: moderateScale(radii.button),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minHeight: verticalScale(42),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(12),
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: moderateScale(13),
  },
  removeButton: {
    marginTop: verticalScale(8),
    borderRadius: moderateScale(radii.button),
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: "#FFF3F3",
    minHeight: verticalScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonInline: {
    flex: 1,
    borderRadius: moderateScale(radii.button),
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: "#FFF3F3",
    minHeight: verticalScale(42),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(12),
  },
  removeText: {
    color: colors.danger,
    fontFamily: fonts.heading,
    fontSize: moderateScale(13),
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
    fontSize: moderateScale(12),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(9,18,39,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: moderateScale(radii.card),
    borderTopRightRadius: moderateScale(radii.card),
    padding: moderateScale(16),
    gap: scale(10),
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
    fontSize: moderateScale(20),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(10),
  },
  modalHeaderTitle: {
    flex: 1,
  },
  modalCloseButton: {
    width: scale(34),
    height: verticalScale(34),
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
  modalMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: moderateScale(12),
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(radii.button),
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
    justifyContent: "flex-end",
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  modeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    backgroundColor: colors.surfaceAlt,
  },
  modeChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  modeChipText: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: moderateScale(12),
  },
  modeChipTextActive: {
    color: colors.primaryDark,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    marginBottom: verticalScale(8),
    backgroundColor: colors.surfaceAlt,
  },
  flexOne: {
    flex: 1,
  },
  historyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: moderateScale(14),
  },
  historyMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: moderateScale(12),
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: moderateScale(13),
    paddingVertical: verticalScale(10),
  },
  accordionList: {
    marginTop: verticalScale(6),
    gap: verticalScale(10),
  },
  accordionSection: {
    borderRadius: moderateScale(radii.card),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(10),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
  },
  accordionTitle: {
    fontFamily: fonts.heading,
    fontSize: moderateScale(14),
    color: colors.textPrimary,
  },
  accordionMeta: {
    fontFamily: fonts.body,
    fontSize: moderateScale(12),
    color: colors.textMuted,
  },
  accordionBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: moderateScale(12),
    gap: verticalScale(10),
  },
  tenantCard: {
    backgroundColor: colors.surface,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: colors.border,
    padding: moderateScale(14),
  },
  tenantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: verticalScale(12),
  },
  tenantInfo: {
    flex: 1,
    marginRight: scale(12),
  },
  tenantName: {
    fontFamily: fonts.heading,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    marginBottom: verticalScale(4),
  },
  tenantDue: {
    fontFamily: fonts.body,
    fontSize: moderateScale(14),
  },
  moreDetailsButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: moderateScale(radii.button),
    paddingVertical: verticalScale(10),
    alignItems: "center",
  },
  moreDetailsText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: moderateScale(14),
  },
});
