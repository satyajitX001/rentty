import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { getPayments } from "../services/api/collectionService";
import { queryKeys } from "../services/api/queryKeys";
import { getTenants } from "../services/api/tenantService";
import { colors, fonts } from "../theme/tokens";

const money = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function CollectionsScreen() {
  const monthKey = useMemo(() => currentMonthKey(), []);
  const tenantsQuery = useQuery({ queryKey: queryKeys.tenants.list, queryFn: () => getTenants() });
  const paymentsQuery = useQuery({
    queryKey: [...queryKeys.collections.payments, monthKey],
    queryFn: () => getPayments({ month: monthKey }),
  });

  if (tenantsQuery.isPending || paymentsQuery.isPending) {
    return (
      <Screen title="Collections" subtitle="Pending dues and payment timeline">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (tenantsQuery.isError || paymentsQuery.isError) {
    return (
      <Screen title="Collections" subtitle="Pending dues and payment timeline">
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
    <Screen title="Collections" subtitle="A clean ledger view for what is pending and what came in">
      <InfoCard title="Collections This Month">
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
                Due day {tenant.rentDueDay} | Joined {tenant.joinedOn?.slice(0, 10)}
              </Text>
            </View>
            <Pill label={money(tenant.dueAmount)} tone="warning" />
          </View>
        ))}
      </InfoCard>

      <InfoCard title={`Recent Collections | ${monthKey}`}>
        {payments.length === 0 ? <Text style={styles.meta}>No collections recorded for this month yet.</Text> : null}
        {payments.slice(0, 12).map((payment) => (
          <View key={payment.id} style={styles.row}>
            <View style={styles.flexOne}>
              <Text style={styles.bold}>{money(payment.amount)}</Text>
              <Text style={styles.meta}>
                Paid {payment.paidOn.slice(0, 10)} | Due {payment.dueMonth} | {payment.mode}
              </Text>
              <Text style={styles.meta}>{payment.receiptNo ?? payment.id}</Text>
            </View>
            <Pill label="Captured" tone="success" />
          </View>
        ))}
      </InfoCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricItem: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    gap: 4,
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
    gap: 10,
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
  bold: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.heading,
  },
});
