import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { mockApi } from "../services/mockApi";
import { colors, fonts } from "../theme/tokens";
import { AlertItem, DashboardSummary, Property, SupportTicket } from "../types/models";

const currency = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

export function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    async function loadData() {
      const [dashboardData, propertyData, alertData, ticketData] = await Promise.all([
        mockApi.getDashboard(),
        mockApi.getProperties(),
        mockApi.getAlerts(),
        mockApi.getSupportTickets()
      ]);
      setSummary(dashboardData);
      setProperties(propertyData);
      setAlerts(alertData);
      setTickets(ticketData);
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading || !summary) {
    return (
      <Screen title="RentOk Dashboard" subtitle="Hostel operations at a glance">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen title="RentOk Dashboard" subtitle="Simple daily control for caretaker and owner">
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
  }
});
