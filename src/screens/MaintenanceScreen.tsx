import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DateField } from "../components/DateField";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { createMaintenanceRequest, getMaintenanceRequests, updateMaintenanceStatus } from "../services/api/maintenanceService";
import { getProperties } from "../services/api/propertyService";
import { queryKeys } from "../services/api/queryKeys";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { MaintenanceRequest } from "../types/models";
import { getUserFriendlyErrorMessage } from "../utils/errors";
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

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : "-";
}

function hasDisplayText(value?: string) {
  const trimmed = value?.trim();
  return Boolean(trimmed && trimmed !== "-");
}

export function MaintenanceScreen() {
  const { colors, fonts, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const defaultMonth = useMemo(() => currentMonthKey(), []);
  const [monthKey, setMonthKey] = useState(defaultMonth);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [isCreateVisible, setIsCreateVisible] = useState(false);
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [servicedOn, setServicedOn] = useState("");
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
  const properties = useMemo(
    () => (propertiesQuery.data ?? []).filter((property) => property.id.trim().length > 0),
    [propertiesQuery.data]
  );
  const selectedProperty = properties.find((property) => property.id === selectedPropertyId);

  const totalSpent = useMemo(
    () => requests.reduce((sum, request) => sum + (request.status === "resolved" ? request.estimatedCost : 0), 0),
    [requests]
  );
  const openCount = requests.filter((request) => request.status !== "resolved").length;

  const invalidateMaintenance = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.requests }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary, refetchType: "all" })
    ]);
  };

  const resetForm = () => {
    setSelectedPropertyId("");
    setIsPropertyPickerOpen(false);
    setTitle("");
    setRoomNumber("");
    setServicedOn("");
    setDescription("");
    setServiceProvider("");
    setEstimatedCost("");
    setPriority("medium");
  };

  const openCreateModal = async () => {
    resetForm();
    setIsCreateVisible(true);
    const latestProperties = await queryClient.fetchQuery({
      queryKey: queryKeys.properties.list,
      queryFn: getProperties,
    });
    const availableProperties = latestProperties.filter((property) => property.id.trim().length > 0);
    if (availableProperties.length === 1) {
      setSelectedPropertyId(availableProperties[0]!.id);
    }
  };

  useEffect(() => {
    if (!isCreateVisible || selectedPropertyId || properties.length !== 1) {
      return;
    }
    setSelectedPropertyId(properties[0]!.id);
  }, [isCreateVisible, properties, selectedPropertyId]);

  const closeCreateModal = () => {
    setIsCreateVisible(false);
    resetForm();
  };

  const createMutation = useMutation({
    mutationFn: createMaintenanceRequest,
    onSuccess: async () => {
      setIsCreateVisible(false);
      resetForm();
      await invalidateMaintenance();
    },
    onError: (error) => {
      Alert.alert(
        "Unable to log maintenance",
        getUserFriendlyErrorMessage(error, "Please check the highlighted fields and try again.")
      );
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: MaintenanceRequest["status"] }) =>
      updateMaintenanceStatus(requestId, { status }),
    onSuccess: invalidateMaintenance,
    onError: (error) => {
      Alert.alert("Update failed", getUserFriendlyErrorMessage(error, "Please try updating the status again."));
    },
    onSettled: () => {
      setActiveRequestId(null);
    }
  });

  const parsedCost = Number(estimatedCost);
  const hasProperty = selectedPropertyId.length > 0;
  const hasTitle = title.trim().length >= 3;
  const hasRoom = roomNumber.trim().length >= 1;
  const hasDate = servicedOn.trim().length > 0;
  const hasAmount = estimatedCost.trim().length > 0 && Number.isFinite(parsedCost) && parsedCost >= 0;
  const canCreate = hasProperty && hasTitle && hasRoom && hasDate && hasAmount && !createMutation.isPending;

  const saveHint = !hasProperty
    ? properties.length === 0
      ? "No property found. Add a property from Dashboard first."
      : "Tap Select property and choose one from the list."
    : !hasTitle
      ? "Enter a work title (at least 3 characters)."
      : !hasRoom
        ? "Enter room / area."
        : !hasDate
          ? "Pick a maintenance date."
          : !hasAmount
            ? "Enter amount spent / estimate."
            : "";

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
      <Screen title="Maintenance" subtitle="Repairs, spending and closure" showHeader={false}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (requestsQuery.isError || propertiesQuery.isError) {
    return (
      <Screen title="Maintenance" subtitle="Repairs, spending and closure" showHeader={false}>
        <InfoCard title="Unable to load maintenance">
          <Text style={styles.meta}>Please check API server and retry.</Text>
        </InfoCard>
      </Screen>
    );
  }

  return (
    <Screen title="Maintenance" subtitle="Log repairs against properties and track spend" showHeader={false}>
      <InfoCard
        title="Maintenance Desk"
        rightNode={(
          <Pressable style={styles.inlineAction} onPress={openCreateModal}>
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
        const descriptionText = hasDisplayText(request.description) ? request.description.trim() : "";
        const propertyName = hasDisplayText(property?.name) ? property!.name.trim() : "";
        const roomLabel = hasDisplayText(request.roomNumber) ? request.roomNumber.trim() : "";
        const servicedDate = hasDisplayText(request.servicedOn ?? request.requestedOn)
          ? formatDate(request.servicedOn ?? request.requestedOn)
          : "";
        const serviceProviderName = hasDisplayText(request.serviceProvider) ? request.serviceProvider.trim() : "";
        const hasCost = Number.isFinite(request.estimatedCost);

        return (
          <InfoCard
            key={request.id}
            title={request.title}
            rightNode={<Pill label={request.status.replace("_", " ").toUpperCase()} tone={statusTone[request.status]} />}
          >
            {descriptionText ? <Text style={styles.desc}>{descriptionText}</Text> : null}
            {propertyName ? (
              <View style={styles.row}>
                <Text style={styles.meta}>Property</Text>
                <Text style={styles.value}>{propertyName}</Text>
              </View>
            ) : null}
            {roomLabel ? (
              <View style={styles.row}>
                <Text style={styles.meta}>Room / Area</Text>
                <Text style={styles.value}>{roomLabel}</Text>
              </View>
            ) : null}
            {servicedDate ? (
              <View style={styles.row}>
                <Text style={styles.meta}>Serviced On</Text>
                <Text style={styles.value}>{servicedDate}</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.meta}>Priority</Text>
              <Pill label={request.priority.toUpperCase()} tone={request.priority === "high" ? "danger" : "default"} />
            </View>
            {serviceProviderName ? (
              <View style={styles.row}>
                <Text style={styles.meta}>Service Provider</Text>
                <Text style={styles.value}>{serviceProviderName}</Text>
              </View>
            ) : null}
            {hasCost ? (
              <View style={styles.row}>
                <Text style={styles.meta}>Estimated / Actual Cost</Text>
                <Text style={styles.value}>{money(request.estimatedCost)}</Text>
              </View>
            ) : null}
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

      <Modal visible={isCreateVisible} transparent animationType="slide" onRequestClose={closeCreateModal}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Maintenance</Text>
              <Pressable style={styles.modalCloseButton} onPress={closeCreateModal}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalMeta}>Attach every repair to a property so reports show rent collected vs maintenance spend.</Text>

              <Text style={styles.fieldLabel}>
                Property <Text style={styles.requiredMark}>*</Text>
              </Text>
              {properties.length === 0 ? (
                <Text style={styles.modalMeta}>No property found. Add one from Dashboard, then reopen this form.</Text>
              ) : (
                <>
                  <Pressable
                    style={styles.selectField}
                    onPress={() => setIsPropertyPickerOpen((open) => !open)}
                  >
                    <Text style={selectedProperty ? styles.selectValue : styles.selectPlaceholder}>
                      {selectedProperty?.name ?? "Select property"}
                    </Text>
                    <Text style={styles.selectChevron}>{isPropertyPickerOpen ? "▲" : "▼"}</Text>
                  </Pressable>
                  {isPropertyPickerOpen ? (
                    <View style={styles.propertyPickerList}>
                      {properties.map((property) => {
                        const selected = selectedPropertyId === property.id;
                        return (
                          <Pressable
                            key={property.id}
                            style={[styles.propertyOption, selected && styles.propertyOptionActive]}
                            onPress={() => {
                              setSelectedPropertyId(property.id);
                              setIsPropertyPickerOpen(false);
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
                    </View>
                  ) : null}
                </>
              )}

              <Text style={styles.fieldLabel}>
                Work title <Text style={styles.requiredMark}>*</Text>
              </Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Bathroom plumbing" placeholderTextColor={colors.textMuted} />
              <Text style={styles.fieldLabel}>
                Room / area <Text style={styles.requiredMark}>*</Text>
              </Text>
              <TextInput style={styles.input} value={roomNumber} onChangeText={setRoomNumber} placeholder="e.g. First floor, Room 204" placeholderTextColor={colors.textMuted} />
              <Text style={styles.fieldLabel}>
                Maintenance date <Text style={styles.requiredMark}>*</Text>
              </Text>
              <DateField value={servicedOn} onChange={setServicedOn} placeholder="Pick maintenance date" />
              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Notes / issue details (optional)" placeholderTextColor={colors.textMuted} multiline />
              <TextInput style={styles.input} value={serviceProvider} onChangeText={setServiceProvider} placeholder="Service provider (optional)" placeholderTextColor={colors.textMuted} />
              <Text style={styles.fieldLabel}>
                Amount <Text style={styles.requiredMark}>*</Text>
              </Text>
              <TextInput style={styles.input} value={estimatedCost} onChangeText={setEstimatedCost} placeholder="Amount spent / estimate" placeholderTextColor={colors.textMuted} keyboardType="numeric" />

              <Text style={styles.fieldLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {priorities.map((item) => (
                  <Pressable key={item} style={[styles.priorityChip, priority === item && styles.priorityChipActive]} onPress={() => setPriority(item)}>
                    <Text style={[styles.priorityText, priority === item && styles.priorityTextActive]}>{item.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </View>

              {selectedProperty ? <Text style={styles.modalMeta}>Linked property: {selectedProperty.name}</Text> : null}
              {!canCreate && !createMutation.isPending && saveHint ? (
                <Text style={styles.helperText}>{saveHint}</Text>
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={closeCreateModal}>
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
                    requestedOn: servicedOn.trim(),
                    description: description.trim() || undefined,
                    priority,
                    serviceProvider: serviceProvider.trim() || undefined,
                    estimatedCost: parsedCost,
                  });
                }}
              >
                <Text style={styles.primaryButtonText}>{createMutation.isPending ? "Saving..." : "Save"}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) => StyleSheet.create({
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
    height: "90%",
    maxHeight: "90%",
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    gap: 10,
    paddingBottom: 8,
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
  requiredMark: {
    color: colors.danger,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  propertyList: {
    maxHeight: 172,
  },
  propertyPickerList: {
    gap: 8,
  },
  selectField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  selectPlaceholder: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    flex: 1,
  },
  selectValue: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14,
    flex: 1,
  },
  selectChevron: {
    color: colors.textMuted,
    fontFamily: fonts.heading,
    fontSize: 12,
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
    backgroundColor: colors.surfaceAlt,
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
  helperText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
  },
});
