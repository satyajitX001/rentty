import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { queryKeys } from "../services/api/queryKeys";
import { getTenants } from "../services/api/tenantService";
import { colors, fonts } from "../theme/tokens";

const money = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

export function TenantsScreen() {
  const tenantsQuery = useQuery({ queryKey: queryKeys.tenants.list, queryFn: getTenants });

  if (tenantsQuery.isPending) {
    return (
      <Screen title="Tenant Management" subtitle="Tenants, leases and KYC">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (tenantsQuery.isError) {
    return (
      <Screen title="Tenant Management" subtitle="Tenants, leases and KYC">
        <InfoCard title="Unable to load tenants">
          <Text style={styles.error}>Please check server/API availability and try again.</Text>
        </InfoCard>
      </Screen>
    );
  }

  const tenantList = tenantsQuery.data ?? [];
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
  },
  error: {
    color: colors.warning,
    fontFamily: fonts.heading,
    fontSize: 13
  }
});
