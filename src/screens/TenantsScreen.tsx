import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { mockApi } from "../services/mockApi";
import { colors, fonts } from "../theme/tokens";
import { Tenant } from "../types/models";

const money = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

export function TenantsScreen() {
  const [loading, setLoading] = useState(true);
  const [tenantList, setTenantList] = useState<Tenant[]>([]);

  useEffect(() => {
    async function loadTenants() {
      const data = await mockApi.getTenants();
      setTenantList(data);
      setLoading(false);
    }

    loadTenants();
  }, []);

  if (loading) {
    return (
      <Screen title="Tenant Management" subtitle="Tenants, leases and KYC">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const dueCount = tenantList.filter((tenant) => tenant.dueAmount > 0).length;

  return (
    <Screen title="Tenant Management" subtitle={`${tenantList.length} tenants | ${dueCount} with dues`}>
      {tenantList.map((tenant) => (
        <InfoCard
          key={tenant.id}
          title={`${tenant.fullName} | ${tenant.roomNumber}`}
          rightNode={<Pill label={tenant.status.toUpperCase()} tone={tenant.status === "active" ? "success" : "warning"} />}
        >
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{tenant.phone}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Lease</Text>
            <Text style={styles.value}>
              {tenant.leaseStart} to {tenant.leaseEnd}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rent</Text>
            <Text style={styles.value}>{money(tenant.monthlyRent)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Due</Text>
            <Text style={[styles.value, tenant.dueAmount > 0 ? styles.danger : styles.success]}>{money(tenant.dueAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>KYC</Text>
            <Pill label={tenant.kycVerified ? "VERIFIED" : "PENDING"} tone={tenant.kycVerified ? "success" : "warning"} />
          </View>
        </InfoCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body
  },
  value: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.heading
  },
  danger: {
    color: colors.danger
  },
  success: {
    color: colors.success
  }
});
