import React, { useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Screen } from "../components/Screen";
import { reportCards } from "../data/reportCards";
import { getDocuments } from "../services/api/documentService";
import { getExpenses } from "../services/api/expenseService";
import { queryKeys } from "../services/api/queryKeys";
import { generateReport } from "../services/api/reportService";
import { colors, fonts, radii, shadows } from "../theme/tokens";

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  return { firstDay, lastDay, monthKey };
}

export function ReportsScreen() {
  const { firstDay, lastDay, monthKey } = useMemo(() => getCurrentMonthRange(), []);
  const { width } = useWindowDimensions();
  const [downloadText, setDownloadText] = useState("No report download yet.");
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [lastDownloadUrl, setLastDownloadUrl] = useState<string | null>(null);

  const documentsQuery = useQuery({ queryKey: queryKeys.documents.list, queryFn: () => getDocuments() });
  const expensesQuery = useQuery({ queryKey: [...queryKeys.expenses.list, monthKey], queryFn: () => getExpenses(monthKey) });

  const reportMutation = useMutation({
    mutationFn: generateReport,
    onSuccess: (result) => {
      if (result.downloadUrl) {
        setLastDownloadUrl(result.downloadUrl);
        setDownloadText(`Report ready: ${result.downloadUrl}`);
        return;
      }

      setLastDownloadUrl(null);
      setDownloadText(`${result.fileName ?? "Report"} generated successfully.`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to generate report.";
      setLastDownloadUrl(null);
      setDownloadText(message);
    },
    onSettled: () => {
      setActiveReportId(null);
    }
  });

  const loading = documentsQuery.isPending || expensesQuery.isPending;
  const reportWidth = useMemo(() => (width >= 420 ? "48%" : "100%"), [width]);

  if (loading) {
    return (
      <Screen title="Reports and Documents" subtitle="Accounting and excel exports">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (documentsQuery.isError || expensesQuery.isError) {
    return (
      <Screen title="Reports and Documents" subtitle="Accounting and excel exports">
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Unable to load reports data</Text>
          <Text style={styles.itemMeta}>Please check API server and retry.</Text>
        </View>
      </Screen>
    );
  }

  const docs = documentsQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];

  return (
    <Screen title="Reports and Documents" subtitle="Accounting | Excel Reports | Centralized records">
      <LinearGradient colors={["#3A7BFF", "#133CA6"]} style={styles.hero}>
        <Text style={styles.heroTitle}>Accounting and Excel Reports</Text>
        <Text style={styles.heroMeta}>{downloadText}</Text>
        {lastDownloadUrl ? (
          <Pressable
            style={styles.openLinkButton}
            onPress={() => {
              void Linking.openURL(lastDownloadUrl);
            }}
          >
            <Text style={styles.openLinkButtonText}>Open Last Report</Text>
          </Pressable>
        ) : null}
      </LinearGradient>

      <View style={styles.reportGrid}>
        {reportCards.map((report) => {
          const buttonLoading = reportMutation.isPending && activeReportId === report.id;

          return (
            <View key={report.id} style={[styles.reportCard, { width: reportWidth }]}>
              <View style={styles.reportHeader}>
                <Text style={[styles.reportTitle, { color: report.accent }]}>{report.title}</Text>
                <Text style={styles.reportIcon}>{report.icon}</Text>
              </View>
              {report.points.map((point) => (
                <Text key={point} style={styles.reportPoint}>
                  - {point}
                </Text>
              ))}
              <Pressable
                style={[styles.downloadButton, { borderColor: report.accent }]}
                onPress={() => {
                  setActiveReportId(report.id);
                  reportMutation.mutate({
                    reportType: report.reportType,
                    from: firstDay,
                    to: lastDay,
                    format: "xlsx"
                  });
                }}
                disabled={buttonLoading}
              >
                {buttonLoading ? (
                  <ActivityIndicator color={report.accent} size="small" />
                ) : (
                  <Text style={[styles.downloadText, { color: report.accent }]}>Download Report</Text>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Document Organization</Text>
        {docs.map((doc) => (
          <View key={doc.id} style={styles.row}>
            <View style={styles.flexOne}>
              <Text style={styles.itemTitle}>{doc.title}</Text>
              <Text style={styles.itemMeta}>
                {doc.fileType.toUpperCase()} | {doc.uploadedOn}
              </Text>
            </View>
            <Text style={styles.itemTag}>{doc.tags.join(", ")}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Expense Summary</Text>
        {expenses.map((expense) => (
          <View key={expense.id} style={styles.row}>
            <View style={styles.flexOne}>
              <Text style={styles.itemTitle}>{expense.category}</Text>
              <Text style={styles.itemMeta}>
                {`${expense.paidBy} -> ${expense.paidTo}`}
              </Text>
            </View>
            <Text style={styles.amount}>INR {expense.amount.toLocaleString("en-IN")}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 18,
    padding: 14,
    gap: 6
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 19,
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
    borderColor: colors.border,
    gap: 6,
    ...shadows.card
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  reportTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    flex: 1
  },
  reportIcon: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12
  },
  reportPoint: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.body
  },
  downloadButton: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: radii.button,
    paddingVertical: 8,
    alignItems: "center",
    minHeight: 40,
    justifyContent: "center"
  },
  downloadText: {
    fontFamily: fonts.heading,
    fontSize: 13
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
    ...shadows.card
  },
  sectionTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fonts.display
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2
  },
  flexOne: {
    flex: 1
  },
  itemTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 13
  },
  itemMeta: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12
  },
  itemTag: {
    color: colors.primaryDark,
    fontSize: 12,
    textTransform: "capitalize",
    maxWidth: 130,
    textAlign: "right",
    fontFamily: fonts.heading
  },
  amount: {
    fontFamily: fonts.display,
    color: colors.primaryDark,
    fontSize: 13
  }
});
