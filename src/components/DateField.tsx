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
  const pickerValue = useMemo(() => parseInputDate(value), [value]);

  const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") {
      setOpen(false);
    }
    if (event.type === "dismissed" || !selectedDate) return;
    onChange(toISODate(selectedDate));
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value || placeholder}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onPickerChange}
        />
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
});
