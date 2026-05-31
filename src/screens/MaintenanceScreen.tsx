import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DateField } from "../components/DateField";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { createMaintenanceRequest, getMaintenanceRequests, updateMaintenanceStatus } from "../services/api/maintenanceService";
import { getProperties } from "../services/api/propertyService";
import { queryKeys } from "../services/api/queryKeys";
import { colors, fonts, radii } from "../theme/tokens";
import { MaintenanceRequest } from "../types/models";
import { currentMonthKey, monthLabel, shiftMonth } from "../utils/month";

const money = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

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

const priorities: MaintenanceRequest["priority"][] = ["low", "medium", "high"];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : "-";
}

export function MaintenanceScreen() {
  const queryClient = useQueryClient();
  const defaultMonth = useMemo(() => currentMonthKey(), []);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [monthKey, setMonthKey] = useState(defaultMonth);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [isCreateVisible, setIsCreateVisible] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [roomNumber, setRoomNumber] = useState("Property");
  const [servicedOn, setServicedOn] = useState(today);
  const [description, setDescription] = useState("");
  const [serviceProvider, setServiceProvider] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [priority, setPriority] = useState<MaintenanceRequest["priority"]>("medium");

  const requestsQuery = useQuery({
    queryKey: [...queryKeys.maintenance.requests, monthKey],
    queryFn: () => getMaintenanceRequests({ month: monthKey })
  });
  const propertiesQuery = useQuery({ queryKey: queryKeys.properties.list, queryFn: getProperties });

  const requests = requestsQuery.data ?? [];
  const properties = propertiesQuery.data ?? [];
  const selectedProperty = properties.find((property) => property.id === selectedPropertyId);

  const totalSpent = useMemo(
    () => requests.reduce((sum, request) => sum + (request.status === "resolved" ? request.estimatedCost : 0), 0),
    [requests]
  );
  const openCount = requests.filter((request) => request.status !== "resolved").length;

  const invalidateMaintenance = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.requests }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary })
    ]);
  };

  const resetForm = () => {
    setSelectedPropertyId("");
    setTitle("");
    setRoomNumber("Property");
    setServicedOn(today);
    setDescription("");
    setServiceProvider("");
    setEstimatedCost("");
    setPriority("medium");
  };

  const createMutation = useMutation({
    mutationFn: createMaintenanceRequest,
    onSuccess: async () => {
      setIsCreateVisible(false);
      resetForm();
      await invalidateMaintenance();
    },
    onError: (error) => {
      Alert.alert("Unable to log maintenance", getErrorMessage(error));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: MaintenanceRequest["status"] }) =>
      updateMaintenanceStatus(requestId, { status }),
    onSuccess: invalidateMaintenance,
    onError: (error) => {
      Alert.alert("Update failed", getErrorMessage(error));
    },
    onSettled: () => {
      setActiveRequestId(null);
    }
  });

  const canCreate =
    selectedPropertyId.length > 0 &&
    title.trim().length >= 3 &&
    roomNumber.trim().length > 0 &&
    servicedOn.trim().length > 0 &&
    Number(estimatedCost || 0) >= 0 &&
    !createMutation.isPending;

  const updateRequest = async (requestId: string, current: MaintenanceRequest["status"]) => {
    if (current === "resolved") {
      Alert.alert("Already resolved", "This maintenance item is already resolved.");
      return;
    }

    setActiveRequestId(requestId);
    await updateMutation.mutateAsync({ requestId, status: nextStatus[current] });
  };

  if (requestsQuery.isPending || propertiesQuery.isPending) {
    return (
      <Screen title="Maintenance" subtitle="Repairs, spending and closure">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (requestsQuery.isError || propertiesQuery.isError) {
    return (
      <Screen title="Maintenance" subtitle="Repairs, spending and closure">
        <InfoCard title="Unable to load maintenance">
          <Text style={styles.meta}>Please check API server and retry.</Text>
        </InfoCard>
      </Screen>
    );
  }

  return (
    <Screen title="Maintenance" subtitle="Log repairs against properties and track spend">
      <InfoCard
        title="Maintenance Desk"
        rightNode={(
          <Pressable style={styles.inlineAction} onPress={() => setIsCreateVisible(true)}>
            <Text style={styles.inlineActionText}>+ Add</Text>
          </Pressable>
        )}
      >
        <View style={styles.monthPicker}>
          <Pressable style={styles.monthButton} onPress={() => setMonthKey((current) => shiftMonth(current, -1))}>
            <Text style={styles.monthButtonText}>Prev</Text>
          </Pressable>
          <View style={styles.monthCenter}>
            <Text style={styles.monthTitle}>{monthLabel(monthKey)}</Text>
            <Text style={styles.monthMeta}>Maintenance serviced in this month</Text>
          </View>
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
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{openCount}</Text>
            <Text style={styles.metricLabel}>Open / Active</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{money(totalSpent)}</Text>
            <Text style={styles.metricLabel}>Resolved Spend</Text>
          </View>
        </View>
      </InfoCard>

      {requests.length === 0 ? (
        <InfoCard title="No maintenance logged">
          <Text style={styles.meta}>No maintenance activities for {monthLabel(monthKey)}.</Text>
        </InfoCard>
      ) : null}

      {requests.map((request) => {
        const buttonLoading = updateMutation.isPending && activeRequestId === request.id;
        const property = properties.find((item) => item.id === request.propertyId);

        return (
          <InfoCard
            key={request.id}
            title={request.title}
            rightNode={<Pill label={request.status.replace("_", " ").toUpperCase()} tone={statusTone[request.status]} />}
          >
            <Text style={styles.desc}>{request.description || "No description added."}</Text>
            <View style={styles.row}>
              <Text style={styles.meta}>Property</Text>
              <Text style={styles.value}>{property?.name ?? request.roomNumber}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.meta}>Serviced On</Text>
              <Text style={styles.value}>{formatDate(request.servicedOn ?? request.requestedOn)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.meta}>Priority</Text>
              <Pill label={request.priority.toUpperCase()} tone={request.priority === "high" ? "danger" : "default"} />
            </View>
            <View style={styles.row}>
              <Text style={styles.meta}>Service Provider</Text>
              <Text style={styles.value}>{request.serviceProvider}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.meta}>Estimated / Actual Cost</Text>
              <Text style={styles.value}>{money(request.estimatedCost)}</Text>
            </View>
            <Pressable style={styles.button} onPress={() => updateRequest(request.id, request.status)} disabled={buttonLoading || request.status === "resolved"}>
              {buttonLoading ? (
                <ActivityIndicator color={colors.primaryDark} size="small" />
              ) : (
                <Text style={styles.buttonText}>{request.status === "resolved" ? "Resolved" : `Move to ${nextStatus[request.status].replace("_", " ")}`}</Text>
              )}
            </Pressable>
          </InfoCard>
        );
      })}

      <Modal visible={isCreateVisible} transparent animationType="slide" onRequestClose={() => setIsCreateVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Maintenance</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsCreateVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>Attach every repair to a property so reports show rent collected vs maintenance spend.</Text>

            <Text style={styles.fieldLabel}>Property</Text>
            <ScrollView style={styles.propertyList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {properties.map((property) => {
                const selected = selectedPropertyId === property.id;
                return (
                  <Pressable
                    key={property.id}
                    style={[styles.propertyOption, selected && styles.propertyOptionActive]}
                    onPress={() => {
                      setSelectedPropertyId(property.id);
                      setRoomNumber(property.name);
                    }}
                  >
                    <View style={styles.propertyOptionTextWrap}>
                      <Text style={[styles.propertyOptionTitle, selected && styles.propertyOptionTitleActive]}>{property.name}</Text>
                      <Text style={[styles.propertyOptionMeta, selected && styles.propertyOptionMetaActive]}>{property.address}</Text>
                    </View>
                    {selected ? <Text style={styles.selectedMark}>Selected</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Work title, e.g. Bathroom plumbing" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={roomNumber} onChangeText={setRoomNumber} placeholder="Room / area" placeholderTextColor={colors.textMuted} />
            <DateField value={servicedOn} onChange={setServicedOn} placeholder="Maintenance date" />
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Notes / issue details" placeholderTextColor={colors.textMuted} multiline />
            <TextInput style={styles.input} value={serviceProvider} onChangeText={setServiceProvider} placeholder="Service provider" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={estimatedCost} onChangeText={setEstimatedCost} placeholder="Amount spent / estimate" placeholderTextColor={colors.textMuted} keyboardType="numeric" />

            <View style={styles.priorityRow}>
              {priorities.map((item) => (
                <Pressable key={item} style={[styles.priorityChip, priority === item && styles.priorityChipActive]} onPress={() => setPriority(item)}>
                  <Text style={[styles.priorityText, priority === item && styles.priorityTextActive]}>{item.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>

            {selectedProperty ? <Text style={styles.modalMeta}>Selected: {selectedProperty.name}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsCreateVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, !canCreate && styles.buttonDisabled]}
                disabled={!canCreate}
                onPress={() => {
                  createMutation.mutate({
                    propertyId: selectedPropertyId,
                    roomNumber: roomNumber.trim(),
                    title: title.trim(),
                    servicedOn: servicedOn.trim(),
                    description: description.trim() || undefined,
                    priority,
                    serviceProvider: serviceProvider.trim() || undefined,
                    estimatedCost: Number(estimatedCost || 0),
                  });
                }}
              >
                <Text style={styles.primaryButtonText}>{createMutation.isPending ? "Saving..." : "Save"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    gap: 2,
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
    paddingVertical: 4,
  },
  resetMonthText: {
    color: colors.primary,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  metricBox: {
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
  inlineAction: {
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  inlineActionText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  desc: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
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
    fontSize: 13,
    flex: 1,
    textAlign: "right",
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
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 20,
    flex: 1,
  },
  modalMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
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
  fieldLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  propertyList: {
    maxHeight: 172,
  },
  propertyOption: {
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  propertyOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  propertyOptionTextWrap: {
    flex: 1,
    gap: 2,
  },
  propertyOptionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  propertyOptionTitleActive: {
    color: "#FFFFFF",
  },
  propertyOptionMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  propertyOptionMetaActive: {
    color: "#D9E6FF",
  },
  selectedMark: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 11,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
  },
  priorityChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  priorityText: {
    color: colors.textMuted,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  priorityTextActive: {
    color: colors.primaryDark,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
