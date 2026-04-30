import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { DateField } from "../components/DateField";
import { getDashboardSummary } from "../services/api/dashboardService";
import { getNotifications } from "../services/api/notificationService";
import {
  assignCaretaker,
  getProperties,
} from "../services/api/propertyService";
import { queryKeys } from "../services/api/queryKeys";
import { getSupportTickets } from "../services/api/supportService";
import { createTenant, getTenants } from "../services/api/tenantService";
import { useAuth } from "../store/AuthContext";
import { colors, fonts, radii } from "../theme/tokens";
import { DashboardSummary, Property } from "../types/models";
import { AppStackParamList } from "../navigation/AppStackNavigator";

const currency = (value: number) => `INR ${value.toLocaleString("en-IN")}`;

const emptySummary: DashboardSummary = {
  totalProperties: 0,
  occupiedProperties: 0,
  availableProperties: 0,
  activeTenants: 0,
  pendingDues: 0,
  monthCollection: 0,
  openMaintenance: 0,
  monthExpenses: 0,
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unable to load data.";
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : "-";
}

function initials(name?: string) {
  if (!name) return "RO";
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queryClient = useQueryClient();
  const summaryQuery = useQuery({ queryKey: queryKeys.dashboard.summary, queryFn: getDashboardSummary });
  const propertiesQuery = useQuery({ queryKey: queryKeys.properties.list, queryFn: getProperties });
  const alertsQuery = useQuery({ queryKey: queryKeys.notifications.list, queryFn: getNotifications });
  const ticketsQuery = useQuery({ queryKey: queryKeys.support.tickets, queryFn: getSupportTickets });

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isPropertyDetailVisible, setIsPropertyDetailVisible] = useState(false);
  const [isTenantModalVisible, setIsTenantModalVisible] = useState(false);
  const [isCaretakerModalVisible, setIsCaretakerModalVisible] = useState(false);

  const propertyHistoryQuery = useQuery({
    queryKey: [...queryKeys.tenants.list, "history", selectedProperty?.id ?? "none"],
    queryFn: () => getTenants({ propertyId: selectedProperty?.id, includeInactive: true }),
    enabled: Boolean(selectedProperty?.id),
  });

  const [tenantName, setTenantName] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantRent, setTenantRent] = useState("");
  const [tenantRentDay, setTenantRentDay] = useState("");
  const [tenantJoinedOn, setTenantJoinedOn] = useState("");
  const [tenantAdvance, setTenantAdvance] = useState("");
  const [tenantOpeningDue, setTenantOpeningDue] = useState("");

  const [caretakerName, setCaretakerName] = useState("");
  const [caretakerPhone, setCaretakerPhone] = useState("");

  const invalidateOperationalQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
    ]);
  };

  const createTenantMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: async () => {
      setTenantName("");
      setTenantAddress("");
      setTenantPhone("");
      setTenantRent("");
      setTenantRentDay("");
      setTenantJoinedOn("");
      setTenantAdvance("");
      setTenantOpeningDue("");
      setIsTenantModalVisible(false);
      setIsPropertyDetailVisible(false);
      await invalidateOperationalQueries();
    },
  });

  const assignCaretakerMutation = useMutation({
    mutationFn: ({ propertyId, caretaker, caretakerPhone: phone }: { propertyId: string; caretaker?: string; caretakerPhone: string }) =>
      assignCaretaker(propertyId, { caretaker, caretakerPhone: phone }),
    onSuccess: async (result) => {
      setCaretakerName("");
      setCaretakerPhone("");
      setIsCaretakerModalVisible(false);
      setIsPropertyDetailVisible(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.properties.list });

      if (result.onboarding?.accountCreated) {
        Alert.alert(
          "Caretaker onboarded",
          `Phone: ${result.onboarding.phone}\nTemporary password: ${result.onboarding.tempPassword ?? "shared default"}`
        );
      }
    },
  });

  const loading =
    summaryQuery.isPending ||
    propertiesQuery.isPending ||
    alertsQuery.isPending ||
    ticketsQuery.isPending;

  const summary = summaryQuery.data ?? emptySummary;
  const properties = propertiesQuery.data ?? [];
  const alerts = alertsQuery.data ?? [];
  const tickets = ticketsQuery.data ?? [];
  const propertyHistory = propertyHistoryQuery.data ?? [];

  const featuredProperties = useMemo(() => properties, [properties]);

  const selectedPropertyOccupied =
    (selectedProperty?.occupancyStatus ?? "available") === "occupied";

  const canCreateTenant =
    Boolean(selectedProperty?.id) &&
    !selectedPropertyOccupied &&
    tenantName.trim().length >= 2 &&
    tenantAddress.trim().length >= 5 &&
    tenantPhone.trim().length >= 8 &&
    Number(tenantRent) >= 0 &&
    Number(tenantRentDay) >= 1 &&
    Number(tenantRentDay) <= 31 &&
    tenantJoinedOn.trim().length > 0 &&
    !createTenantMutation.isPending;

  const canAssignCaretaker =
    Boolean(selectedProperty?.id) &&
    caretakerPhone.trim().length >= 8 &&
    !assignCaretakerMutation.isPending;

  const firstError =
    summaryQuery.error ?? propertiesQuery.error ?? alertsQuery.error ?? ticketsQuery.error ?? null;

  const openCreateProperty = () => {
    navigation.navigate("PropertyForm");
  };

  const openPropertyDetail = (property: Property) => {
    setSelectedProperty(property);
    setCaretakerName(property.caretaker ?? "");
    setCaretakerPhone(property.caretakerPhone ?? "");
    setIsPropertyDetailVisible(true);
  };

  if (loading) {
    return (
      <Screen title="RentOk Dashboard" subtitle="Operations home for owner and caretaker">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen title="RentOk Dashboard" subtitle="Operations home for owner and caretaker">
      <LinearGradient colors={["#FFFFFF", "#EFF5FF"]} style={styles.profileShell}>
        <View style={styles.profileBadge}>
          <Text style={styles.profileBadgeText}>{initials(user?.name)}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name ?? "RentOk User"}</Text>
          <Text style={styles.profileMeta}>
            {(user?.role ?? "caretaker").toUpperCase()} | {summary.totalProperties} properties under watch
          </Text>
        </View>
      </LinearGradient>

      {firstError ? (
        <InfoCard title="Network Notice">
          <Text style={styles.warningText}>{getErrorMessage(firstError)}</Text>
        </InfoCard>
      ) : null}

      <View style={styles.metricGrid}>
        <LinearGradient colors={["#2B66FF", "#173FAF"]} style={styles.heroMetric}>
          <Text style={styles.heroMetricLabel}>Pending Dues</Text>
          <Text style={styles.heroMetricValue}>{currency(summary.pendingDues)}</Text>
          <Text style={styles.heroMetricSub}>Keep this low with timely follow-ups.</Text>
        </LinearGradient>
        <InfoCard title="Collection This Month" value={currency(summary.monthCollection)} style={styles.metricCard} />
        <InfoCard title="Occupied" value={`${summary.occupiedProperties}`} style={styles.metricCard} />
        <InfoCard title="Available" value={`${summary.availableProperties}`} style={styles.metricCard} />
      </View>

      <InfoCard
        title="Properties Studio"
        rightNode={
          user?.role === "owner" ? (
            <Pressable style={styles.inlineAction} onPress={openCreateProperty}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primaryDark} />
            </Pressable>
          ) : undefined
        }
      >
        {featuredProperties.length === 0 ? (
          <Pressable style={styles.emptyPropertyCta} onPress={openCreateProperty}>
            <Text style={styles.emptyPropertyText}>No properties yet. Tap here to add one.</Text>
          </Pressable>
        ) : null}
        {featuredProperties.map((property) => (
          <Pressable
            key={property.id}
            style={styles.propertyRow}
            onPress={() => openPropertyDetail(property)}
          >
            <View style={styles.flexOne}>
              <Text style={styles.propertyTitle}>{property.name}</Text>
              <Text style={styles.propertyMeta}>{property.address}</Text>
              <Text style={styles.propertyMeta}>
                Caretaker: {property.caretakerPhone ?? "Not assigned"}
              </Text>
            </View>
            <View style={styles.propertySide}>
              <Pill
                label={(property.occupancyStatus ?? "available").toUpperCase()}
                tone={(property.occupancyStatus ?? "available") === "occupied" ? "warning" : "success"}
              />
              {user?.role === "owner" ? (
                <Pressable
                  style={styles.editPill}
                  onPress={() => navigation.navigate("PropertyForm", { property })}
                >
                  <Text style={styles.editPillText}>Edit</Text>
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        ))}
      </InfoCard>

      <InfoCard title="Operations Pulse">
        <View style={styles.pulseRow}>
          <View style={styles.pulseItem}>
            <Text style={styles.pulseValue}>{summary.activeTenants}</Text>
            <Text style={styles.pulseLabel}>Active Tenants</Text>
          </View>
          <View style={styles.pulseItem}>
            <Text style={styles.pulseValue}>{summary.openMaintenance}</Text>
            <Text style={styles.pulseLabel}>Open Maintenance</Text>
          </View>
          <View style={styles.pulseItem}>
            <Text style={styles.pulseValue}>{currency(summary.monthExpenses)}</Text>
            <Text style={styles.pulseLabel}>Expenses</Text>
          </View>
        </View>
      </InfoCard>

      <InfoCard title="Signals">
        {alerts.slice(0, 3).map((alert) => (
          <View key={alert.id} style={styles.signalRow}>
            <View style={styles.flexOne}>
              <Text style={styles.signalTitle}>{alert.title}</Text>
              <Text style={styles.signalMeta}>{alert.message}</Text>
            </View>
            <Pill label={alert.type.toUpperCase()} tone={alert.type === "payment" ? "warning" : "default"} />
          </View>
        ))}
        {alerts.length === 0 ? <Text style={styles.propertyHint}>No active signals.</Text> : null}
      </InfoCard>

      <InfoCard title="Support Queue">
        {tickets.slice(0, 3).map((ticket) => (
          <View key={ticket.id} style={styles.signalRow}>
            <View style={styles.flexOne}>
              <Text style={styles.signalTitle}>{ticket.subject}</Text>
              <Text style={styles.signalMeta}>Created {ticket.createdOn}</Text>
            </View>
            <Pill label={ticket.status} tone={ticket.status === "resolved" ? "success" : "warning"} />
          </View>
        ))}
        {tickets.length === 0 ? <Text style={styles.propertyHint}>No support items right now.</Text> : null}
      </InfoCard>

      <Modal
        visible={isPropertyDetailVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPropertyDetailVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.largeModal]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, styles.modalHeaderTitle]}>{selectedProperty?.name ?? "Property"}</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsPropertyDetailVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>{selectedProperty?.address ?? ""}</Text>
            <Text style={styles.modalMeta}>
              Status: {(selectedProperty?.occupancyStatus ?? "available").toUpperCase()}
            </Text>

            <View style={styles.stackActions}>
              <Pressable
                style={[styles.primaryButton, selectedPropertyOccupied && styles.buttonDisabled]}
                disabled={selectedPropertyOccupied}
                onPress={() => {
                  if (selectedPropertyOccupied || !selectedProperty) return;
                  setIsPropertyDetailVisible(false);
                  navigation.navigate("TenantForm", {
                    propertyId: selectedProperty.id,
                    propertyName: selectedProperty.name,
                    propertyAddress: selectedProperty.address,
                  });
                }}
              >
                <Text style={styles.primaryButtonText}>
                  {selectedPropertyOccupied ? "Property Occupied" : "Add Tenant"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setIsPropertyDetailVisible(false);
                  setIsCaretakerModalVisible(true);
                }}
              >
                <Text style={styles.secondaryButtonText}>Assign Caretaker</Text>
              </Pressable>
              {user?.role === "owner" && selectedProperty ? (
                <Pressable style={styles.secondaryButton} onPress={() => {
                  setIsPropertyDetailVisible(false);
                  navigation.navigate("PropertyForm", { property: selectedProperty });
                }}>
                  <Text style={styles.secondaryButtonText}>Edit Property</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.historyBlock}>
              <Text style={styles.historyTitle}>Occupancy Timeline</Text>
              {propertyHistoryQuery.isPending ? <ActivityIndicator color={colors.primary} /> : null}
              {propertyHistory.slice(0, 6).map((tenant) => (
                <View key={tenant.id} style={styles.historyRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.signalTitle}>{tenant.fullName}</Text>
                    <Text style={styles.signalMeta}>
                      Joined {formatDate(tenant.joinedOn)} | Vacated {formatDate(tenant.vacatedOn)}
                    </Text>
                  </View>
                  <Pill label={tenant.status.toUpperCase()} tone={tenant.status === "active" ? "success" : "default"} />
                </View>
              ))}
              {!propertyHistoryQuery.isPending && propertyHistory.length === 0 ? (
                <Text style={styles.propertyHint}>No tenant history for this property yet.</Text>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isTenantModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTenantModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, styles.modalHeaderTitle]}>Add Tenant</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsTenantModalVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>{selectedProperty?.name ?? ""}</Text>
            <TextInput style={styles.input} placeholder="Tenant name" placeholderTextColor={colors.textMuted} value={tenantName} onChangeText={setTenantName} />
            <TextInput style={styles.input} placeholder="Tenant address" placeholderTextColor={colors.textMuted} value={tenantAddress} onChangeText={setTenantAddress} />
            <TextInput style={styles.input} placeholder="Mobile number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" value={tenantPhone} onChangeText={setTenantPhone} />
            <TextInput style={styles.input} placeholder="Monthly rent" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={tenantRent} onChangeText={setTenantRent} />
            <TextInput style={styles.input} placeholder="Pay day in month (1-31)" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={tenantRentDay} onChangeText={setTenantRentDay} />
            <DateField
              value={tenantJoinedOn}
              onChange={setTenantJoinedOn}
              placeholder="Joined on"
            />
            <TextInput style={styles.input} placeholder="Advance amount" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={tenantAdvance} onChangeText={setTenantAdvance} />
            <TextInput style={styles.input} placeholder="Opening due amount" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={tenantOpeningDue} onChangeText={setTenantOpeningDue} />
            {createTenantMutation.isError ? <Text style={styles.warningText}>{getErrorMessage(createTenantMutation.error)}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsTenantModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, !canCreateTenant && styles.buttonDisabled]}
                disabled={!canCreateTenant}
                onPress={() => {
                  if (!selectedProperty?.id) return;
                  createTenantMutation.mutate({
                    fullName: tenantName.trim(),
                    fullAddress: tenantAddress.trim(),
                    phone: tenantPhone.trim(),
                    propertyId: selectedProperty.id,
                    monthlyRent: Number(tenantRent),
                    rentDueDay: Number(tenantRentDay),
                    joinedOn: tenantJoinedOn.trim(),
                    advanceAmount: Number(tenantAdvance || 0),
                    openingDueAmount: Number(tenantOpeningDue || 0),
                  });
                }}
              >
                <Text style={styles.primaryButtonText}>
                  {createTenantMutation.isPending ? "Saving..." : "Save Tenant"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isCaretakerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCaretakerModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, styles.modalHeaderTitle]}>Assign Caretaker</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsCaretakerModalVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>{selectedProperty?.name ?? ""}</Text>
            <TextInput style={styles.input} placeholder="Caretaker name (optional)" placeholderTextColor={colors.textMuted} value={caretakerName} onChangeText={setCaretakerName} />
            <TextInput style={styles.input} placeholder="Caretaker mobile" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" value={caretakerPhone} onChangeText={setCaretakerPhone} />
            {assignCaretakerMutation.isError ? <Text style={styles.warningText}>{getErrorMessage(assignCaretakerMutation.error)}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsCaretakerModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, !canAssignCaretaker && styles.buttonDisabled]}
                disabled={!canAssignCaretaker}
                onPress={() => {
                  if (!selectedProperty?.id) return;
                  assignCaretakerMutation.mutate({
                    propertyId: selectedProperty.id,
                    caretaker: caretakerName.trim() || undefined,
                    caretakerPhone: caretakerPhone.trim(),
                  });
                }}
              >
                <Text style={styles.primaryButtonText}>
                  {assignCaretakerMutation.isPending ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileShell: {
    borderRadius: 24,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBadgeText: {
    color: "#FFFFFF",
    fontFamily: fonts.display,
    fontSize: 18,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  profileMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  metricGrid: {
    gap: 10,
  },
  heroMetric: {
    borderRadius: 24,
    padding: 16,
    gap: 5,
  },
  heroMetricLabel: {
    color: "#DCE7FF",
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  heroMetricValue: {
    color: "#FFFFFF",
    fontFamily: fonts.display,
    fontSize: 28,
  },
  heroMetricSub: {
    color: "#C9DBFF",
    fontFamily: fonts.body,
    fontSize: 12,
  },
  metricCard: {
    width: "100%",
  },
  inlineAction: {
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  emptyPropertyCta: {
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  emptyPropertyText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  propertyRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  propertyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  propertyMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  propertySide: {
    alignItems: "flex-end",
    gap: 8,
  },
  editPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editPillText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 11,
  },
  propertyHint: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  pulseRow: {
    flexDirection: "row",
    gap: 10,
  },
  pulseItem: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    gap: 4,
  },
  pulseValue: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  pulseLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  signalTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  signalMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  flexOne: {
    flex: 1,
  },
  warningText: {
    color: colors.warning,
    fontFamily: fonts.heading,
    fontSize: 12,
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
    maxHeight: "88%",
  },
  largeModal: {
    minHeight: "58%",
  },
  modalTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  modalHeaderTitle: {
    flex: 1,
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
  modalMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
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
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
  stackActions: {
    gap: 8,
  },
  primaryButton: {
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
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    flex: 1,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  historyBlock: {
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 3,
  },
});
