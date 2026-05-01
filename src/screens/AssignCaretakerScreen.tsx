import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { assignCaretaker } from "../services/api/propertyService";
import { queryKeys } from "../services/api/queryKeys";
import { colors, fonts, radii } from "../theme/tokens";
import { AppStackParamList } from "../navigation/AppStackNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "AssignCaretaker">;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unable to assign caretaker.";
}

export function AssignCaretakerScreen({ navigation, route }: Props) {
  const { property } = route.params;
  const queryClient = useQueryClient();

  const [caretakerName, setCaretakerName] = useState(property.caretaker ?? "");
  const [caretakerPhone, setCaretakerPhone] = useState(property.caretakerPhone ?? "");

  const assignMutation = useMutation({
    mutationFn: () =>
      assignCaretaker(property.id, {
        caretaker: caretakerName.trim() || undefined,
        caretakerPhone: caretakerPhone.trim(),
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.properties.list });

      if (result.onboarding?.accountCreated) {
        Alert.alert(
          "Caretaker Onboarded",
          `Phone: ${result.onboarding.phone}\nTemporary password: ${result.onboarding.tempPassword ?? "shared default"}`
        );
      }
      navigation.goBack();
    },
  });

  const canSave = caretakerPhone.trim().length >= 8 && !assignMutation.isPending;

  return (
    <Screen
      title="Assign Caretaker"
      subtitle={property.name}
      children={
        <View style={styles.container}>
          <InfoCard title="Caretaker Details">
            <TextInput
              style={styles.input}
              placeholder="Caretaker name (optional)"
              placeholderTextColor={colors.textMuted}
              value={caretakerName}
              onChangeText={setCaretakerName}
            />
            <TextInput
              style={styles.input}
              placeholder="Caretaker mobile number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={caretakerPhone}
              onChangeText={setCaretakerPhone}
            />
          </InfoCard>

          {assignMutation.isError ? (
            <Text style={styles.error}>{getErrorMessage(assignMutation.error)}</Text>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, !canSave && styles.disabled]}
              onPress={() => assignMutation.mutate()}
              disabled={!canSave}
            >
              <Text style={styles.primaryText}>
                {assignMutation.isPending ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.page,
    padding: 12,
    gap: 12,
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
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
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
