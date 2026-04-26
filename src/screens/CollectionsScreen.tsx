import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { mockApi } from "../services/mockApi";
import { colors, fonts, radii } from "../theme/tokens";
import { Payment, Tenant } from "../types/models";

const money = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

export function CollectionsScreen() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [tenantData, paymentData] = await Promise.all([mockApi.getTenants(), mockApi.getPayments()]);
      setTenants([...tenantData]);
      setPayments([...paymentData]);
      setLoading(false);
    }

    loadData();
  }, []);

  const pendingTenants = useMemo(() => tenants.filter((tenant) => tenant.dueAmount > 0), [tenants]);

  const collectFirstDue = async () => {
    if (pendingTenants.length === 0) {
      Alert.alert("All clear", "No pending dues right now.");
      return;
    }

    const target = pendingTenants[0];
    const amount = Math.min(target.dueAmount, target.monthlyRent);

    try {
      setCollecting(true);
      const result = await mockApi.collectRent({
        tenantId: target.id,
        amount,
        mode: "UPI",
        paidOn: new Date().toISOString().slice(0, 10),
        notes: "Auto-collected from demo action"
      });

      const [tenantData, paymentData] = await Promise.all([mockApi.getTenants(), mockApi.getPayments()]);
      setTenants([...tenantData]);
      setPayments([...paymentData]);
      Alert.alert("Receipt generated", `Receipt ${result.receipt.receiptNo}\nBalance: ${money(result.receipt.balanceDue)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Collection failed", message);
    } finally {
      setCollecting(false);
    }
  };

  if (loading) {
    return (
      <Screen title="Rent Collection" subtitle="Payments, reminders and receipts">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen title="Rent Collection" subtitle="Fast collection flow with receipt generation">
      <InfoCard title="Pending Dues" value={money(pendingTenants.reduce((sum, item) => sum + item.dueAmount, 0))}>
        <Text style={styles.meta}>Tenants with pending dues: {pendingTenants.length}</Text>
        <Pressable style={[styles.button, collecting && styles.buttonDisabled]} onPress={collectFirstDue} disabled={collecting}>
          <Text style={styles.buttonLabel}>{collecting ? "Collecting..." : "Collect Next Pending Due"}</Text>
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
    marginTop: 8
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 13
  }
});
