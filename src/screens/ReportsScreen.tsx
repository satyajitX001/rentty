import React, { useMemo, useState } from "react";
import { ActivityIndicator, DimensionValue, Linking, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation } from "@tanstack/react-query";
import { Screen } from "../components/Screen";
import { reportCards } from "../data/reportCards";
import { generateReport, ReportType } from "../services/api/reportService";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { buildMonthOptions, currentMonthKey, monthLabel, monthRange, shiftMonth } from "../utils/month";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const reportIcons: Record<ReportType, IconName> = {
  dues: "notifications-outline",
  complaint: "alert-circle-outline",
  tenant: "people-outline",
  expense: "card-outline",
  lead: "person-add-outline",
  collection: "wallet-outline",
};

export function ReportsScreen() {
  const { colors, fonts, radii, shadows } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const defaultMonth = useMemo(() => currentMonthKey(), []);
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const { width } = useWindowDimensions();
  const [monthKey, setMonthKey] = useState(defaultMonth);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("collection");
  const [downloadText, setDownloadText] = useState("Choose a report and download a month-wise PDF.");
  const [lastDownloadUrl, setLastDownloadUrl] = useState<string | null>(null);

  const selectedReport = reportCards.find((report) => report.reportType === selectedReportType) ?? reportCards[0]!;
  const reportWidth = useMemo<DimensionValue>(() => (width >= 420 ? "48%" : "100%"), [width]);

  const reportMutation = useMutation({
    mutationFn: generateReport,
    onSuccess: (result) => {
      if (result.downloadUrl) {
        setLastDownloadUrl(result.downloadUrl);
        setDownloadText(`${result.fileName ?? "Report"} is ready as PDF.`);
        void Linking.openURL(result.downloadUrl);
        return;
      }

      setLastDownloadUrl(null);
      setDownloadText("Report generated, but no download URL was returned.");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to generate report.";
      setLastDownloadUrl(null);
      setDownloadText(message);
    }
  });

  const downloadPdf = () => {
    const range = monthRange(monthKey);
    reportMutation.mutate({
      reportType: selectedReportType,
      from: range.from,
      to: range.to,
      format: "pdf",
    });
  };

  return (
    <Screen title="Reports" subtitle="Month-wise PDF reports for finance review" showHeader={false}>
      <LinearGradient colors={["#173FAF", "#2B66FF"]} style={styles.hero}>
        <Text style={styles.heroEyebrow}>PDF CENTER</Text>
        <Text style={styles.heroTitle}>Monthly reports</Text>
        <Text style={styles.heroMeta}>{downloadText}</Text>
        {lastDownloadUrl ? (
          <Pressable style={styles.openLinkButton} onPress={() => void Linking.openURL(lastDownloadUrl)}>
            <Text style={styles.openLinkButtonText}>Open Last PDF</Text>
          </Pressable>
        ) : null}
      </LinearGradient>

      <View style={styles.monthCard}>
        <Pressable style={styles.monthButton} onPress={() => setMonthKey((current) => shiftMonth(current, -1))}>
          <Text style={styles.monthButtonText}>Prev</Text>
        </Pressable>
        <Pressable style={styles.monthCenter} onPress={() => setIsMonthPickerVisible(true)}>
          <Text style={styles.monthTitle}>{monthLabel(monthKey)}</Text>
          <Text style={styles.monthMeta}>Tap month to jump quickly</Text>
        </Pressable>
        <Pressable style={styles.monthButton} onPress={() => setMonthKey((current) => shiftMonth(current, 1))}>
          <Text style={styles.monthButtonText}>Next</Text>
        </Pressable>
      </View>
      {monthKey !== defaultMonth ? (
        <Pressable style={styles.resetMonth} onPress={() => setMonthKey(defaultMonth)}>
          <Text style={styles.resetMonthText}>Back to current month</Text>
        </Pressable>
      ) : null}

      <View style={styles.reportGrid}>
        {reportCards.map((report) => {
          const selected = selectedReportType === report.reportType;

          return (
            <Pressable
              key={report.id}
              style={[styles.reportCard, { width: reportWidth, borderColor: selected ? report.accent : colors.border }, selected && styles.reportCardActive]}
              onPress={() => setSelectedReportType(report.reportType)}
            >
              <View style={styles.reportHeader}>
                <View style={[styles.iconBubble, { backgroundColor: `${report.accent}18` }]}>
                  <Ionicons name={reportIcons[report.reportType]} size={19} color={report.accent} />
                </View>
                <Text style={[styles.reportTitle, { color: report.accent }]}>{report.title}</Text>
              </View>
              <Text style={styles.reportPoint}>{report.points.slice(0, 3).join(" | ")}</Text>
              {selected ? <Text style={styles.selectedText}>Selected</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <Pressable style={[styles.downloadButton, reportMutation.isPending && styles.buttonDisabled]} onPress={downloadPdf} disabled={reportMutation.isPending}>
        {reportMutation.isPending ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.downloadButtonText}>Download {selectedReport.title} PDF</Text>
        )}
      </Pressable>

      <Modal visible={isMonthPickerVisible} transparent animationType="slide" onRequestClose={() => setIsMonthPickerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Month</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsMonthPickerVisible(false)}>
                <Text style={styles.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <View style={styles.monthOptionGrid}>
              {monthOptions.map((option) => {
                const selected = option === monthKey;
                return (
                  <Pressable
                    key={option}
                    style={[styles.monthOption, selected && styles.monthOptionActive]}
                    onPress={() => {
                      setMonthKey(option);
                      setIsMonthPickerVisible(false);
                    }}
                  >
                    <Text style={[styles.monthOptionText, selected && styles.monthOptionTextActive]}>{monthLabel(option)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) => StyleSheet.create({
  hero: {
    borderRadius: 22,
    padding: 16,
    gap: 6
  },
  heroEyebrow: {
    color: "#D9E6FF",
    fontSize: 12,
    fontFamily: fonts.heading,
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: fonts.display
  },
  heroMeta: {
    color: "#D9E6FF",
    fontSize: 12,
    fontFamily: fonts.body
  },
  openLinkButton: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#D9E6FF",
    borderRadius: radii.button,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  openLinkButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 12
  },
  monthCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    padding: 12,
    ...shadows.card,
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
  reportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 12,
    borderWidth: 1,
    gap: 6,
    ...shadows.card
  },
  reportCardActive: {
    backgroundColor: colors.primarySoft,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  reportTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    flex: 1
  },
  reportPoint: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.body
  },
  selectedText: {
    color: colors.primaryDark,
    fontFamily: fonts.heading,
    fontSize: 12,
  },
  downloadButton: {
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.65,
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
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "82%",
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
  monthOptionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  monthOption: {
    width: "48%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  monthOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthOptionText: {
    color: colors.textSecondary,
    fontFamily: fonts.heading,
    fontSize: 12,
    textAlign: "center",
  },
  monthOptionTextActive: {
    color: "#FFFFFF",
  },
});
