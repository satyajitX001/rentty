import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { colors, fonts, radii } from "../theme/tokens";

type Props = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseInputDate(value: string) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function DateField({ value, placeholder, onChange }: Props) {
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
      onChange(toISODate(selectedDate));
    }
  };

  const handleConfirm = () => {
    onChange(toISODate(tempDate));
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setTempDate(pickerValue);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.field} onPress={() => {
        setTempDate(pickerValue);
        setOpen(true);
      }}>
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value || placeholder}
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

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  field: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: "center",
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
