import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { createProperty, updateProperty } from "../services/api/propertyService";
import { queryKeys } from "../services/api/queryKeys";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { AppStackParamList } from "../navigation/AppStackNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "PropertyForm">;

const propertyTypes = ["hostels", "flat", "villa"] as const;
type PropertyType = (typeof propertyTypes)[number];

const flatSizes = ["1BHK", "2BHK", "3BHK"] as const;
type FlatSize = (typeof flatSizes)[number];

const prorationModes = ["full_month", "pro_rata_daily", "next_cycle"] as const;
type ProrationMode = (typeof prorationModes)[number];

const prorationLabels: Record<ProrationMode, string> = {
  full_month: "Full Month",
  pro_rata_daily: "Daily Calculation",
  next_cycle: "Next Rent Cycle",
};
const prorationDescriptions: Record<ProrationMode, string> = {
  full_month: "Charge full month rent regardless of join date",
  pro_rata_daily: "Calculate daily rate × days based on due date",
  next_cycle: "Skip partial month, first charge on next due date",
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unable to save property.";
}

export function PropertyFormScreen({ navigation, route }: Props) {
  const { colors, fonts, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  const editItem = route.params?.property;
  const [name, setName] = useState(editItem?.name ?? "");
  const [address, setAddress] = useState(editItem?.address ?? "");
  const [type, setType] = useState<PropertyType>(editItem?.type ?? "hostels");
  const [prorationMode, setProrationMode] = useState<ProrationMode>(editItem?.prorationMode ?? "pro_rata_daily");
  const [graceDays, setGraceDays] = useState(editItem?.graceDays ?? 0);

  // Caretaker fields
  const [caretakerName, setCaretakerName] = useState(editItem?.caretaker ?? "");
  const [caretakerPhone, setCaretakerPhone] = useState(editItem?.caretakerPhone ?? "");
  const [location, setLocation] = useState("");

  // Type-specific fields
  const [floors, setFloors] = useState("");
  const [rooms, setRooms] = useState("");
  const [flatSize, setFlatSize] = useState<FlatSize>("1BHK");
  const [amenities, setAmenities] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const basePayload = {
        name: name.trim(),
        address: address.trim(),
        type,
        prorationMode,
        graceDays,
        caretakerName: caretakerName.trim() || undefined,
        caretakerPhone: caretakerPhone.trim() || undefined,
        location: location.trim() || undefined,
      };

      const typeSpecificPayload =
        type === "hostels"
          ? { floors: floors ? parseInt(floors, 10) : undefined, rooms: rooms ? parseInt(rooms, 10) : undefined }
          : type === "flat"
          ? { flatSize }
          : type === "villa"
          ? { amenities: amenities.trim() || undefined }
          : {};

      const payload = { ...basePayload, ...typeSpecificPayload };

      if (editItem?.id) {
        return updateProperty(editItem.id, payload);
      }

      return createProperty(payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.properties.list }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary, refetchType: "all" }),
      ]);
      navigation.goBack();
    },
  });

  const canSave = useMemo(
    () => name.trim().length >= 2 && address.trim().length >= 5 && !saveMutation.isPending,
    [address, name, saveMutation.isPending]
  );

  const renderTypeSpecificFields = () => {
    switch (type) {
      case "hostels":
        return (
          <>
            <Text style={styles.sectionLabel}>Hostel Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Number of floors"
              placeholderTextColor={colors.textMuted}
              value={floors}
              onChangeText={setFloors}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Number of rooms"
              placeholderTextColor={colors.textMuted}
              value={rooms}
              onChangeText={setRooms}
              keyboardType="numeric"
            />
          </>
        );
      case "flat":
        return (
          <>
            <Text style={styles.sectionLabel}>Flat Details</Text>
            <Text style={styles.groupLabel}>Flat Size</Text>
            <View style={styles.typeRow}>
              {flatSizes.map((size) => (
                <Pressable
                  key={size}
                  style={[styles.typeChip, flatSize === size && styles.typeChipActive]}
                  onPress={() => setFlatSize(size)}
                >
                  <Text style={[styles.typeText, flatSize === size && styles.typeTextActive]}>{size}</Text>
                </Pressable>
              ))}
            </View>
          </>
        );
      case "villa":
        return (
          <>
            <Text style={styles.sectionLabel}>Villa Details (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Amenities (e.g., Pool, Garden, Garage)"
              placeholderTextColor={colors.textMuted}
              value={amenities}
              onChangeText={setAmenities}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Screen
      title={editItem ? "Edit Property" : "Add Property"}
      subtitle="Property studio form for owners"
      reserveTabBarSpace={false}
      children={
        <View style={styles.container}>
          <InfoCard title="Property Details">
            <TextInput
              style={styles.input}
              placeholder="Property name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Full Address"
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Property Location (Area/Locality)"
              placeholderTextColor={colors.textMuted}
              value={location}
              onChangeText={setLocation}
            />
            <Text style={styles.groupLabel}>Type</Text>
            <View style={styles.typeRow}>
              {propertyTypes.map((item) => (
                <Pressable
                  key={item}
                  style={[styles.typeChip, type === item && styles.typeChipActive]}
                  onPress={() => setType(item)}
                >
                  <Text style={[styles.typeText, type === item && styles.typeTextActive]}>
                    {item.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            {renderTypeSpecificFields()}
          </InfoCard>

          <InfoCard title="Caretaker Information">
            <TextInput
              style={styles.input}
              placeholder="Caretaker Name"
              placeholderTextColor={colors.textMuted}
              value={caretakerName}
              onChangeText={setCaretakerName}
            />
            <TextInput
              style={styles.input}
              placeholder="Caretaker Phone"
              placeholderTextColor={colors.textMuted}
              value={caretakerPhone}
              onChangeText={setCaretakerPhone}
              keyboardType="phone-pad"
            />
          </InfoCard>

          <InfoCard title="Proration Settings">
            <Text style={styles.groupLabel}>First Month Rent Calculation</Text>
            <View style={styles.typeRow}>
              {prorationModes.map((mode) => (
                <Pressable
                  key={mode}
                  style={[styles.typeChip, prorationMode === mode && styles.typeChipActive]}
                  onPress={() => setProrationMode(mode)}
                >
                  <View style={styles.prorationChipContent}>
                    <Text style={[styles.typeText, prorationMode === mode && styles.typeTextActive]}>
                      {prorationLabels[mode]}
                    </Text>
                    <Text style={[styles.prorationDesc, prorationMode === mode && styles.typeTextActive]}>
                      {prorationDescriptions[mode]}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Grace Days (e.g., 5)"
              placeholderTextColor={colors.textMuted}
              value={String(graceDays)}
              onChangeText={(val) => setGraceDays(parseInt(val, 10) || 0)}
              keyboardType="numeric"
            />
            <Text style={styles.prorationNote}>
              This determines how the first month's rent is calculated when a tenant joins mid-month.
              Grace days extend the due date before late fees apply.
            </Text>
          </InfoCard>

          {saveMutation.isError ? (
            <Text style={styles.error}>{getErrorMessage(saveMutation.error)}</Text>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, !canSave && styles.disabled]}
              onPress={() => saveMutation.mutate()}
              disabled={!canSave}
            >
              <Text style={styles.primaryText}>
                {saveMutation.isPending ? "Saving..." : editItem ? "Update" : "Create"}
              </Text>
            </Pressable>
          </View>
        </View>
      }
    />
  );
}

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) => StyleSheet.create({
  container: {
    gap: 12,
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
  groupLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 12,
    marginTop: 4,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 13,
    marginTop: 12,
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  typeText: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  typeTextActive: {
    color: colors.primaryDark,
  },
  prorationChipContent: {
    flexDirection: "column",
    gap: 2,
  },
  prorationDesc: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 10,
  },
  prorationNote: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 8,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    borderRadius: radii.button,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radii.button,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  secondaryText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    color: colors.warning,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
});
