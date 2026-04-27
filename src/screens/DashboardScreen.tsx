import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { getDashboardSummary } from "../services/api/dashboardService";
import { getHealth } from "../services/api/healthService";
import { getNotifications } from "../services/api/notificationService";
import { getProperties } from "../services/api/propertyService";
import { queryKeys } from "../services/api/queryKeys";
import { getSupportTickets } from "../services/api/supportService";
import { useAuth } from "../store/AuthContext";
import { API_BASE_URL } from "../services/api/config";
import { colors, fonts } from "../theme/tokens";
import { DashboardSummary } from "../types/models";

const currency = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

const emptySummary: DashboardSummary = {
  totalProperties: 0,
  occupiedBeds: 0,
  totalBeds: 0,
  activeTenants: 0,
  pendingDues: 0,
  monthCollection: 0,
  openMaintenance: 0,
  monthExpenses: 0
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unable to load data.";
}

export function DashboardScreen() {
  const { user, signOut } = useAuth();
  const summaryQuery = useQuery({ queryKey: queryKeys.dashboard.summary, queryFn: getDashboardSummary });
  const propertiesQuery = useQuery({ queryKey: queryKeys.properties.list, queryFn: getProperties });
  const alertsQuery = useQuery({ queryKey: queryKeys.notifications.list, queryFn: getNotifications });
  const ticketsQuery = useQuery({ queryKey: queryKeys.support.tickets, queryFn: getSupportTickets });
  const healthQuery = useQuery({ queryKey: queryKeys.health, queryFn: getHealth });

  const loading = summaryQuery.isPending || propertiesQuery.isPending || alertsQuery.isPending || ticketsQuery.isPending;
  const summary = summaryQuery.data ?? emptySummary;
  const properties = propertiesQuery.data ?? [];
  const alerts = alertsQuery.data ?? [];
  const tickets = ticketsQuery.data ?? [];

  const healthStatus = (healthQuery.data?.status ?? "unknown").toString().toUpperCase();
  const healthTone = healthStatus === "OK" || healthStatus === "HEALTHY" ? "success" : "warning";

  const firstError =
    summaryQuery.error ?? propertiesQuery.error ?? alertsQuery.error ?? ticketsQuery.error ?? healthQuery.error ?? null;

  if (loading) {
    return (
      <Screen title="RentOk Dashboard" subtitle="Hostel operations at a glance">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen title="RentOk Dashboard" subtitle="Simple daily control for caretaker and owner">
      {firstError ? (
        <InfoCard title="Network Notice">
          <Text style={styles.warningText}>{getErrorMessage(firstError)}</Text>
        </InfoCard>
      ) : null}

      <InfoCard title="Server Health" rightNode={<Pill label={healthStatus} tone={healthTone} />}>
        <Text style={styles.muted}>Base URL: {API_BASE_URL}</Text>
      </InfoCard>

      <InfoCard title="Session">
        <View style={styles.rowSpread}>
          <View style={styles.flexOne}>
            <Text style={styles.bold}>{user?.name ?? "Authenticated User"}</Text>
            <Text style={styles.muted}>Role: {(user?.role ?? "caretaker").toUpperCase()}</Text>
          </View>
          <Pressable style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </InfoCard>

      <View style={styles.grid}>
        <InfoCard title="Properties" value={`${summary.totalProperties}`} style={styles.metricCard} />
        <InfoCard title="Occupancy" value={`${summary.occupiedBeds}/${summary.totalBeds}`} style={styles.metricCard} />
        <InfoCard title="Active Tenants" value={`${summary.activeTenants}`} style={styles.metricCard} />
        <InfoCard title="Open Complaints" value={`${summary.openMaintenance}`} style={styles.metricCard} />
      </View>

      <InfoCard title="This Month Financials">
        <View style={styles.rowSpread}>
          <Text style={styles.line}>Collection</Text>
          <Text style={styles.valuePositive}>{currency(summary.monthCollection)}</Text>
        </View>
        <View style={styles.rowSpread}>
          <Text style={styles.line}>Pending Dues</Text>
          <Text style={styles.valueWarn}>{currency(summary.pendingDues)}</Text>
        </View>
        <View style={styles.rowSpread}>
          <Text style={styles.line}>Expenses</Text>
          <Text style={styles.valueDark}>{currency(summary.monthExpenses)}</Text>
        </View>
        <View style={[styles.rowSpread, styles.netRow]}>
          <Text style={styles.netLabel}>Net Balance</Text>
          <Text style={styles.netValue}>{currency(summary.monthCollection - summary.monthExpenses)}</Text>
        </View>
      </InfoCard>

      <InfoCard title="Properties">
        {properties.map((property) => (
          <View key={property.id} style={styles.listRow}>
            <View style={styles.flexOne}>
              <Text style={styles.bold}>{property.name}</Text>
              <Text style={styles.muted}>{property.address}</Text>
              <Text style={styles.muted}>Caretaker: {property.caretaker}</Text>
            </View>
            <Pill label={`${property.occupiedBeds}/${property.totalBeds} beds`} tone="default" />
          </View>
        ))}
      </InfoCard>

      <InfoCard title="Alerts">
        {alerts.map((alert) => (
          <View key={alert.id} style={styles.alertItem}>
            <View style={styles.rowSpread}>
              <Text style={styles.bold}>{alert.title}</Text>
              <Pill label={alert.type.toUpperCase()} tone={alert.type === "payment" ? "warning" : "default"} />
            </View>
            <Text style={styles.muted}>{alert.message}</Text>
            <Text style={styles.date}>{alert.date}</Text>
          </View>
        ))}
      </InfoCard>

      <InfoCard title="Support">
        {tickets.map((ticket) => (
          <View key={ticket.id} style={styles.listRow}>
            <View style={styles.flexOne}>
              <Text style={styles.bold}>{ticket.subject}</Text>
              <Text style={styles.muted}>Created: {ticket.createdOn}</Text>
            </View>
            <Pill label={ticket.status} tone={ticket.status === "resolved" ? "success" : "warning"} />
          </View>
        ))}
      </InfoCard>

      <InfoCard title="Security and Privacy">
        <Text style={styles.line}>Token-based auth contract (JWT ready)</Text>
        <Text style={styles.line}>Role scaffold for owner and caretaker</Text>
        <Text style={styles.line}>Encrypted storage and transport ready architecture</Text>
      </InfoCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10
  },
  metricCard: {
    width: "48%"
  },
  rowSpread: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4
  },
  flexOne: {
    flex: 1,
    gap: 2
  },
  line: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.body
  },
  valuePositive: {
    fontSize: 13,
    color: colors.success,
    fontFamily: fonts.heading
  },
  valueWarn: {
    fontSize: 13,
    color: colors.warning,
    fontFamily: fonts.heading
  },
  valueDark: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: fonts.heading
  },
  netRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 3,
    paddingTop: 8
  },
  netLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fonts.heading
  },
  netValue: {
    fontSize: 16,
    color: colors.primaryDark,
    fontFamily: fonts.display
  },
  bold: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: fonts.heading
  },
  muted: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.body
  },
  alertItem: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 10,
    gap: 5
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.body
  },
  warningText: {
    color: colors.warning,
    fontSize: 13,
    fontFamily: fonts.heading
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  signOutText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 12
  }
});
