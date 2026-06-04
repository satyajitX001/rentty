import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "../components/Screen";
import { InfoCard } from "../components/InfoCard";
import { getProperties } from "../services/api/propertyService";
import { queryKeys } from "../services/api/queryKeys";
import { useAuth } from "../store/AuthContext";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { scale, verticalScale, moderateScale } from "../utils/scale";

export function PropertyListScreen() {
  const { colors, fonts, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();

  const propertiesQuery = useQuery({
    queryKey: queryKeys.properties.list,
    queryFn: getProperties,
  });

  const properties = propertiesQuery.data ?? [];

  const handleCreateProperty = () => {
    navigation.navigate("PropertyForm");
  };

  const handleSelectProperty = (property: any) => {
    navigation.navigate("PropertyActions", { property });
  };

  if (propertiesQuery.isPending) {
    return (
      <Screen title="Properties Studio" showHeader={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Properties Studio" showHeader={false}>
      <LinearGradient
        colors={[colors.heroStart, colors.heroEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerWrap}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Properties Studio</Text>
            <Text style={styles.subtitle}>All {properties.length} registered properties</Text>
          </View>
          {user?.role === "owner" && (
            <Pressable style={styles.addButton} onPress={handleCreateProperty}>
              <Ionicons name="add-outline" size={24} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      <View style={styles.listContainer}>
        {properties.length === 0 ? (
          <InfoCard title="No Properties Found">
            <Text style={styles.emptyText}>You haven't onboarded any properties yet.</Text>
            {user?.role === "owner" && (
              <Pressable style={styles.createPropertyCta} onPress={handleCreateProperty}>
                <Text style={styles.createPropertyCtaText}>Add Property</Text>
              </Pressable>
            )}
          </InfoCard>
        ) : (
          properties.map((property) => (
            <Pressable
              key={property.id}
              style={styles.propertyCard}
              onPress={() => handleSelectProperty(property)}
            >
              <View style={styles.propertyIconWrap}>
                <Ionicons
                  name={
                    property.type === "flat"
                      ? "business-outline"
                      : property.type === "villa"
                      ? "home-outline"
                      : "bed-outline"
                  }
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.propertyCardBody}>
                <View style={styles.propertyCardHeader}>
                  <Text style={styles.propertyName} numberOfLines={1}>
                    {property.name}
                  </Text>
                  
                </View>
                <Text style={styles.propertyLocation} numberOfLines={1}>
                  {property.address}
                </Text>
                <View style={styles.propertyMetaRow}>
                  {typeof property.occupiedBeds === "number" ||
                  typeof property.totalBeds === "number" ? (
                    <View style={styles.propertyMetaPill}>
                      <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.propertyMetaText}>
                        {property.occupiedBeds ?? 0}/{property.totalBeds ?? 0} beds
                      </Text>
                    </View>
                  ) : null}
                  {property.caretaker ? (
                    <View style={styles.propertyMetaPill}>
                      <Ionicons name="person-circle-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.propertyMetaText} numberOfLines={1}>
                        {property.caretaker}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={{flexDirection:'row', alignItems:'center', gap:scale(8)}}>
              <View
                    style={[
                      styles.propertyStatusChip,
                      property.occupancyStatus === "occupied"
                        ? styles.propertyStatusOccupied
                        : styles.propertyStatusAvailable,
                    ]}
                  >
                    <Text
                      style={[
                        styles.propertyStatusText,
                        property.occupancyStatus === "occupied"
                          ? styles.propertyStatusTextOccupied
                          : styles.propertyStatusTextAvailable,
                      ]}
                    >
                      {(property.occupancyStatus ?? "available").toUpperCase()}
                    </Text>
                  </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: verticalScale(200),
    },
    headerWrap: {
      borderRadius: moderateScale(20),
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(16),
      marginBottom: verticalScale(10),
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(12),
    },
    backButton: {
      width: moderateScale(38),
      height: moderateScale(38),
      borderRadius: moderateScale(19),
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTextWrap: {
      flex: 1,
    },
    title: {
      fontSize: moderateScale(20),
      color: "#FFFFFF",
      fontFamily: fonts.display,
      letterSpacing: 0.1,
    },
    subtitle: {
      fontSize: moderateScale(12),
      color: "#DBE7FF",
      fontFamily: fonts.body,
      marginTop: verticalScale(1),
    },
    addButton: {
      width: moderateScale(38),
      height: moderateScale(38),
      borderRadius: moderateScale(19),
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    listContainer: {
      gap: verticalScale(10),
    },
    emptyText: {
      color: colors.textMuted,
      fontFamily: fonts.body,
      fontSize: moderateScale(13),
      marginBottom: verticalScale(10),
    },
    createPropertyCta: {
      backgroundColor: colors.primary,
      borderRadius: moderateScale(radii.button),
      paddingVertical: verticalScale(11),
      alignItems: "center",
      justifyContent: "center",
    },
    createPropertyCtaText: {
      color: "#FFFFFF",
      fontFamily: fonts.heading,
      fontSize: moderateScale(13),
    },
    propertyCard: {
      width: "100%",
      borderRadius: moderateScale(16),
      padding: moderateScale(14),
      flexDirection: "row",
      alignItems: "center",
      gap: scale(14),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    propertyIconWrap: {
      width: moderateScale(48),
      height: moderateScale(48),
      borderRadius: moderateScale(14),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.primarySoft,
    },
    propertyCardBody: {
      flex: 1,
      gap: verticalScale(6),
    },
    propertyCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: scale(8),
    },
    propertyName: {
      color: colors.textPrimary,
      fontFamily: fonts.heading,
      fontSize: moderateScale(15),
      flex: 1,
    },
    propertyLocation: {
      color: colors.textMuted,
      fontFamily: fonts.body,
      fontSize: moderateScale(12),
    },
    propertyStatusChip: {
      borderRadius: 999,
      paddingHorizontal: scale(8),
      paddingVertical: verticalScale(4),
    },
    propertyStatusOccupied: {
      backgroundColor: "#FEF3C7",
    },
    propertyStatusAvailable: {
      backgroundColor: "#DCFCE7",
    },
    propertyStatusText: {
      fontFamily: fonts.heading,
      fontSize: moderateScale(10),
    },
    propertyStatusTextOccupied: {
      color: "#92400E",
    },
    propertyStatusTextAvailable: {
      color: "#166534",
    },
    propertyMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: scale(6),
    },
    propertyMetaPill: {
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: scale(10),
      paddingVertical: verticalScale(5),
      flexDirection: "row",
      alignItems: "center",
      gap: scale(5),
      maxWidth: "100%",
    },
    propertyMetaText: {
      color: colors.textMuted,
      fontFamily: fonts.body,
      fontSize: moderateScale(11),
    },
  });
