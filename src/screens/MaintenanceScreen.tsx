import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { getMaintenanceRequests, updateMaintenanceStatus } from "../services/api/maintenanceService";
import { queryKeys } from "../services/api/queryKeys";
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
  const queryClient = useQueryClient();
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const requestsQuery = useQuery({ queryKey: queryKeys.maintenance.requests, queryFn: getMaintenanceRequests });

  const updateMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: MaintenanceRequest["status"] }) =>
      updateMaintenanceStatus(requestId, { status }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.requests }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary })
      ]);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to update maintenance status.";
      Alert.alert("Update failed", message);
    },
    onSettled: () => {
      setActiveRequestId(null);
    }
  });

  const requests = requestsQuery.data ?? [];

  const updateRequest = async (requestId: string, current: MaintenanceRequest["status"]) => {
    if (current === "resolved") {
      Alert.alert("Already resolved", "This complaint is already resolved.");
      return;
    }

    setActiveRequestId(requestId);
    await updateMutation.mutateAsync({ requestId, status: nextStatus[current] });
  };

  if (requestsQuery.isPending) {
    return (
      <Screen title="Maintenance" subtitle="Complaints, repair progress and closure">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (requestsQuery.isError) {
    return (
      <Screen title="Maintenance" subtitle="Complaints, repair progress and closure">
        <InfoCard title="Unable to load maintenance requests">
          <Text style={styles.meta}>Please check API server and retry.</Text>
        </InfoCard>
      </Screen>
    );
  }

  return (
    <Screen title="Maintenance" subtitle="Clean ticket flow from open to resolved">
      {requests.map((request) => {
        const buttonLoading = updateMutation.isPending && activeRequestId === request.id;

        return (
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
            <Pressable style={styles.button} onPress={() => updateRequest(request.id, request.status)} disabled={buttonLoading}>
              {buttonLoading ? (
                <ActivityIndicator color={colors.primaryDark} size="small" />
              ) : (
                <Text style={styles.buttonText}>Move to {nextStatus[request.status].replace("_", " ")}</Text>
              )}
            </Pressable>
          </InfoCard>
        );
      })}
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
    backgroundColor: colors.surfaceAlt,
    minHeight: 42,
    justifyContent: "center"
  },
  buttonText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 13
  }
});
