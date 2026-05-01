import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { Pill } from "../components/Pill";
import { colors, fonts, radii } from "../theme/tokens";
import { AppStackParamList } from "../navigation/AppStackNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "PropertyActions">;

export function PropertyActionsScreen({ navigation, route }: Props) {
  const { property } = route.params;
  const isOccupied = property.occupancyStatus === "occupied";

  const handleEditProperty = () => {
    navigation.navigate("PropertyForm", { property });
  };

  const handleAddTenant = () => {
    if (isOccupied) return;
    navigation.navigate("TenantForm", {
      propertyId: property.id,
      propertyName: property.name,
      propertyAddress: property.address,
    });
  };

  const handleAssignCaretaker = () => {
    navigation.navigate("AssignCaretaker", { property });
  };

  return (
    <Screen
      title={property.name}
      subtitle={property.address}
      children={
        <View style={styles.container}>
          <InfoCard
            title="Property Status"
            rightNode={
              <Pill
                label={(property.occupancyStatus ?? "available").toUpperCase()}
                tone={isOccupied ? "warning" : "success"}
              />
            }
          >
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{property.type?.toUpperCase() ?? "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Caretaker</Text>
              <Text style={styles.infoValue}>{property.caretakerPhone ?? "Not assigned"}</Text>
            </View>
          </InfoCard>

          <InfoCard title="Manage Property">
            <Pressable style={styles.actionButton} onPress={handleEditProperty}>
              <View style={styles.actionIcon}>
                <Ionicons name="create-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Edit Property</Text>
                <Text style={styles.actionSubtitle}>Modify name, address, type and details</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={[styles.actionButton, isOccupied && styles.disabledButton]}
              onPress={handleAddTenant}
              disabled={isOccupied}
            >
              <View style={[styles.actionIcon, isOccupied && styles.disabledIcon]}>
                <Ionicons name="person-add-outline" size={22} color={isOccupied ? colors.textMuted : colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, isOccupied && styles.disabledText]}>
                  {isOccupied ? "Property Occupied" : "Add Tenant"}
                </Text>
                <Text style={styles.actionSubtitle}>
                  {isOccupied ? "Tenant already residing" : "Onboard a new tenant"}
                </Text>
              </View>
              {!isOccupied && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
            </Pressable>

            <Pressable style={styles.actionButton} onPress={handleAssignCaretaker}>
              <View style={styles.actionIcon}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Assign Caretaker</Text>
                <Text style={styles.actionSubtitle}>
                  {property.caretakerPhone ? "Update caretaker details" : "Assign a caretaker"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          </InfoCard>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.page,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.heading,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.heading,
  },
  actionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  disabledButton: {
    opacity: 0.7,
  },
  disabledIcon: {
    backgroundColor: colors.surfaceAlt,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
