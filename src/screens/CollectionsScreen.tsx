import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { BottomSheetModalWrapper } from "../components/BottomSheetModal";
import { useQuery } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { getPayments } from "../services/api/collectionService";
import { queryKeys } from "../services/api/queryKeys";
import { getTenants } from "../services/api/tenantService";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { buildMonthOptions, currentMonthKey, monthLabel, shiftMonth } from "../utils/month";
import { formatDate } from "../utils/date";

const money = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

const allocationOptions = [
  { value: "oldest", label: "Oldest Due (FIFO)" },
  { value: "current", label: "Current Month" },
  { value: "future", label: "Future Month" },
] as const;

type AllocationMode = (typeof allocationOptions)[number]["value"];

export function CollectionsScreen() {
  const { colors, fonts, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const defaultMonth = useMemo(() => currentMonthKey(), []);
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const [monthKey, setMonthKey] = useState(defaultMonth);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const tenantsQuery = useQuery({ queryKey: queryKeys.tenants.list, queryFn: () => getTenants() });
  const paymentsQuery = useQuery({
    queryKey: [...queryKeys.collections.payments, monthKey],
    queryFn: () => getPayments({ month: monthKey }),
  });

  if (tenantsQuery.isPending || paymentsQuery.isPending) {
    return (
      <Screen title="Collections" subtitle="Pending dues and payment timeline" showHeader={false}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (tenantsQuery.isError || paymentsQuery.isError) {
    return (
      <Screen title="Collections" subtitle="Pending dues and payment timeline" showHeader={false}>
        <InfoCard title="Unable to load collections">
          <Text style={styles.meta}>Please check API server and retry.</Text>
        </InfoCard>
      </Screen>
    );
  }

  const tenants = tenantsQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const pendingTenants = tenants.filter((tenant) => tenant.dueAmount > 0);
  const totalPending = pendingTenants.reduce((sum, tenant) => sum + tenant.dueAmount, 0);
  const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Screen title="Collections" subtitle="A clean ledger view for what is pending and what came in" showHeader={false}>
      <InfoCard title="Collections">
        <View style={styles.monthPicker}>
          <Pressable style={styles.monthButton} onPress={() => setMonthKey((current) => shiftMonth(current, -1))}>
            <Text style={styles.monthButtonText}>Prev</Text>
          </Pressable>
          <Pressable style={styles.monthCenter} onPress={() => setIsMonthPickerVisible(true)}>
            <Text style={styles.monthTitle}>{monthLabel(monthKey)}</Text>
            <Text style={styles.monthMeta}>Tap month to jump quickly</Text>
          </Pressable>
          <Pressable style={styles.monthButton} onPress={() => setMonthKey((current) => shiftMonth(current, 1))}>
            <Text style={styles.monthButtonText}>Next</Text>
          </Pressable>
        </View>
        {monthKey !== defaultMonth ? (
          <Pressable style={styles.resetMonth} onPress={() => setMonthKey(defaultMonth)}>
            <Text style={styles.resetMonthText}>Back to current month</Text>
          </Pressable>
        ) : null}
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{money(totalCollected)}</Text>
            <Text style={styles.metricLabel}>Collected</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{money(totalPending)}</Text>
            <Text style={styles.metricLabel}>Still Pending</Text>
          </View>
        </View>
      </InfoCard>

      <InfoCard title="Pending Tenants">
        {pendingTenants.length === 0 ? <Text style={styles.meta}>No pending tenants right now.</Text> : null}
        {pendingTenants.map((tenant) => (
          <View key={tenant.id} style={styles.row}>
            <View style={styles.flexOne}>
              <Text style={styles.bold}>{tenant.fullName}</Text>
              <Text style={styles.meta}>
                Due day {tenant.rentDueDay} | Joined {formatDate(tenant.joinedOn)}
              </Text>
              {(tenant.creditBalance ?? 0) > 0 ? (
                <Text style={styles.creditMeta}>Credit: + {money(tenant.creditBalance ?? 0)}</Text>
              ) : null}
            </View>
            <Pill label={money(tenant.dueAmount)} tone="warning" />
          </View>
        ))}
      </InfoCard>

      <InfoCard title={`Collections Ledger | ${monthKey}`}>
        {payments.length === 0 ? <Text style={styles.meta}>No collections recorded for the selected month.</Text> : null}
        {payments.slice(0, 12).map((payment) => (
          <View key={payment.id} style={styles.row}>
            <View style={styles.flexOne}>
              <Text style={styles.bold}>{money(payment.amount)}</Text>
              <Text style={styles.meta}>
                Paid {formatDate(payment.paidOn)} | {payment.mode}
              </Text>
              {payment.allocations && payment.allocations.length > 0 ? (
                <View style={styles.allocationsContainer}>
                  {payment.allocations.map((alloc, idx) => (
                    <Text key={idx} style={styles.allocationText}>
                      {alloc.month}: {money(alloc.amountApplied)} ({alloc.type})
                    </Text>
                  ))}
                </View>
              ) : null}
              <Text style={styles.meta}>{payment.receiptNo ?? payment.id}</Text>
            </View>
            <Pill label="Captured" tone="success" />
          </View>
        ))}
      </InfoCard>

      <BottomSheetModalWrapper
        visible={isMonthPickerVisible}
        onRequestClose={() => setIsMonthPickerVisible(false)}
        snapPoints={["50%", "40%"]}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Month</Text>
            <Pressable style={styles.modalCloseButton} onPress={() => setIsMonthPickerVisible(false)}>
              <Text style={styles.modalCloseText}>X</Text>
            </Pressable>
          </View>
          <View style={styles.monthOptionGrid}>
            {monthOptions.map((option) => {
              const selected = option === monthKey;
              return (
                <Pressable
                  key={option}
                  style={[styles.monthOption, selected && styles.monthOptionActive]}
                  onPress={() => {
                    setMonthKey(option);
                    setIsMonthPickerVisible(false);
                  }}
                >
                  <Text style={[styles.monthOptionText, selected && styles.monthOptionTextActive]}>{monthLabel(option)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </BottomSheetModalWrapper>
    </Screen>
  );
}

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) => StyleSheet.create({
  metricRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  monthPicker: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monthButtonText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  monthCenter: {
    flex: 1,
    alignItems: "center",
  },
  monthTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 16,
  },
  monthMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
    textAlign: "center",
  },
  resetMonth: {
    alignSelf: "center",
    marginTop: 8,
    paddingVertical: 4,
  },
  resetMonthText: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  metricItem: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
  },
  metricValue: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  metricLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  flexOne: {
    flex: 1,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  creditMeta: {
    color: colors.success,
    fontSize: 11,
    fontFamily: fonts.body,
  },
  bold: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.heading,
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
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "82%",
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
  monthOptionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: -4,
    marginRight: -4,
    marginTop: -4,
  },
  monthOption: {
    width: "48%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 10,
    margin: 4,
  },
  monthOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthOptionText: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 12,
    textAlign: "center",
  },
  monthOptionTextActive: {
    color: "#FFFFFF",
  },
  allocationsContainer: {
    marginTop: 4,
  },
  allocationText: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
  },
});
