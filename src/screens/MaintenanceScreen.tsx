import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { mockApi } from "../services/mockApi";
import { colors, fonts, radii } from "../theme/tokens";
import { MaintenanceRequest } from "../types/models";

const statusTone: Record<MaintenanceRequest["status"], "warning" | "success" | "default"> = {
  open: "warning",
  in_progress: "default",
  resolved: "success"
};

const nextStatus: Record<MaintenanceRequest["status"], MaintenanceRequest["status"]> = {
  open: "in_progress",
  in_progress: "resolved",
  resolved: "resolved"
};

export function MaintenanceScreen() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);

  const loadRequests = async () => {
    const data = await mockApi.getMaintenanceRequests();
    setRequests([...data]);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateRequest = async (requestId: string, current: MaintenanceRequest["status"]) => {
    if (current === "resolved") {
      Alert.alert("Already resolved", "This complaint is already resolved.");
      return;
    }

    await mockApi.updateMaintenanceStatus({ requestId, status: nextStatus[current] });
    await loadRequests();
  };

  if (loading) {
    return (
      <Screen title="Maintenance" subtitle="Complaints, repair progress and closure">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen title="Maintenance" subtitle="Clean ticket flow from open to resolved">
      {requests.map((request) => (
        <InfoCard
          key={request.id}
          title={`${request.title} | ${request.roomNumber}`}
          rightNode={<Pill label={request.status.replace("_", " ").toUpperCase()} tone={statusTone[request.status]} />}
        >
          <Text style={styles.desc}>{request.description}</Text>
          <View style={styles.row}>
            <Text style={styles.meta}>Priority</Text>
            <Pill label={request.priority.toUpperCase()} tone={request.priority === "high" ? "danger" : "default"} />
          </View>
          <View style={styles.row}>
            <Text style={styles.meta}>Service Provider</Text>
            <Text style={styles.value}>{request.serviceProvider}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.meta}>Estimated Cost</Text>
            <Text style={styles.value}>INR {request.estimatedCost.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.meta}>Updated On</Text>
            <Text style={styles.value}>{request.updatedOn}</Text>
          </View>
          <Pressable style={styles.button} onPress={() => updateRequest(request.id, request.status)}>
            <Text style={styles.buttonText}>Move to {nextStatus[request.status].replace("_", " ")}</Text>
          </Pressable>
        </InfoCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  desc: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body
  },
  value: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 13
  },
  button: {
    marginTop: 6,
    borderRadius: radii.button,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt
  },
  buttonText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 13
  }
});
