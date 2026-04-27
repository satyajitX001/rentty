import React, { useMemo } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { collectRent, getPayments } from "../services/api/collectionService";
import { queryKeys } from "../services/api/queryKeys";
import { getTenants } from "../services/api/tenantService";
import { colors, fonts, radii } from "../theme/tokens";

const money = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

export function CollectionsScreen() {
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({ queryKey: queryKeys.tenants.list, queryFn: getTenants });
  const paymentsQuery = useQuery({ queryKey: queryKeys.collections.payments, queryFn: () => getPayments() });

  const collectMutation = useMutation({
    mutationFn: collectRent,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tenants.list }),
        queryClient.invalidateQueries({ queryKey: queryKeys.collections.payments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary })
      ]);
      Alert.alert("Receipt generated", `Receipt ${result.receipt.receiptNo}\nBalance: ${money(result.receipt.balanceDue)}`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Collection failed", message);
    }
  });

  const loading = tenantsQuery.isPending || paymentsQuery.isPending;

  const tenants = tenantsQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  const pendingTenants = useMemo(() => tenants.filter((tenant) => tenant.dueAmount > 0), [tenants]);

  const collectFirstDue = async () => {
    if (pendingTenants.length === 0) {
      Alert.alert("All clear", "No pending dues right now.");
      return;
    }

    const target = pendingTenants[0];
    const amount = Math.min(target.dueAmount, target.monthlyRent);

    await collectMutation.mutateAsync({
      tenantId: target.id,
      amount,
      mode: "UPI",
      paidOn: new Date().toISOString().slice(0, 10),
      notes: "Collected via mobile app"
    });
  };

  if (loading) {
    return (
      <Screen title="Rent Collection" subtitle="Payments, reminders and receipts">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (tenantsQuery.isError || paymentsQuery.isError) {
    return (
      <Screen title="Rent Collection" subtitle="Payments, reminders and receipts">
        <InfoCard title="Unable to load collections">
          <Text style={styles.meta}>Please check API server and retry.</Text>
        </InfoCard>
      </Screen>
    );
  }

  return (
    <Screen title="Rent Collection" subtitle="Fast collection flow with receipt generation">
      <InfoCard title="Pending Dues" value={money(pendingTenants.reduce((sum, item) => sum + item.dueAmount, 0))}>
        <Text style={styles.meta}>Tenants with pending dues: {pendingTenants.length}</Text>
        <Pressable
          style={[styles.button, collectMutation.isPending && styles.buttonDisabled]}
          onPress={collectFirstDue}
          disabled={collectMutation.isPending}
        >
          {collectMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonLabel}>Collect Next Pending Due</Text>
          )}
        </Pressable>
      </InfoCard>

      <InfoCard title="Pending Tenants">
        {pendingTenants.length === 0 ? <Text style={styles.meta}>No pending tenants.</Text> : null}
        {pendingTenants.map((tenant) => (
          <View key={tenant.id} style={styles.row}>
            <View>
              <Text style={styles.bold}>{tenant.fullName}</Text>
              <Text style={styles.meta}>Room {tenant.roomNumber}</Text>
            </View>
            <Pill label={money(tenant.dueAmount)} tone="warning" />
          </View>
        ))}
      </InfoCard>

      <InfoCard title="Recent Collections">
        {payments.slice(0, 5).map((payment) => (
          <View key={payment.id} style={styles.row}>
            <View>
              <Text style={styles.bold}>{payment.id.toUpperCase()}</Text>
              <Text style={styles.meta}>
                {payment.paidOn} | {payment.mode}
              </Text>
            </View>
            <Text style={styles.amount}>{money(payment.amount)}</Text>
          </View>
        ))}
      </InfoCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body
  },
  bold: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.heading
  },
  amount: {
    color: colors.primaryDark,
    fontFamily: fonts.display,
    fontSize: 13
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    marginTop: 8,
    minHeight: 44,
    justifyContent: "center"
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 13
  }
});
