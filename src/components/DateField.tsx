import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { formatDate } from "../utils/date";

type Props = {
  value: string;
  placeholder: string;
  label?: string;
  onChange: (value: string) => void;
};

function parseInputDate(value: string) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Convert a local date to UTC midnight of that same calendar date.
 * This ensures the backend (which uses UTC) interprets the date as the
 * calendar date the user selected, regardless of their timezone.
 *
 * Example: User in Asia/Kolkata (UTC+5:30) selects 2024-01-15
 * Returns: 2024-01-15T00:00:00.000Z (UTC midnight of Jan 15)
 */
function toUtcMidnightOfLocalDate(date: Date): string {
  // Get the local date components
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // Create a new Date at UTC midnight of those same calendar values
  const utcDate = new Date(Date.UTC(year, month, day));
  return utcDate.toISOString();
}

export function DateField({ value, placeholder, label, onChange }: Props) {
  const { colors, fonts, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(parseInputDate(value));
  const pickerValue = useMemo(() => parseInputDate(value), [value]);

  const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") {
      setOpen(false);
    }
    if (event.type === "dismissed" || !selectedDate) return;

    if (Platform.OS === "ios") {
      setTempDate(selectedDate);
    } else {
      // Send UTC midnight of the selected local date to backend
      onChange(toUtcMidnightOfLocalDate(selectedDate));
    }
  };

  const handleConfirm = () => {
    // Send UTC midnight of the selected local date to backend
    onChange(toUtcMidnightOfLocalDate(tempDate));
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setTempDate(pickerValue);
  };

  const displayValue = value ? formatDate(value) : "";

  return (
    <View style={styles.container}>
      <Pressable style={styles.field} onPress={() => {
        setTempDate(pickerValue);
        setOpen(true);
      }}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {displayValue || placeholder}
        </Text>
      </Pressable>
      {open ? (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={Platform.OS === "ios" ? tempDate : pickerValue}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onPickerChange}
          />
          {Platform.OS === "ios" ? (
            <View style={styles.buttonRow}>
              <Pressable style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmText}>Confirm</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) => StyleSheet.create({
  container: {
    gap: 4,
  },
  field: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 56,
    justifyContent: "center",
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
    marginBottom: 2,
  },
  valueText: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  placeholderText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.button,
  },
  cancelText: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
  },
  confirmText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 14,
  },
});
