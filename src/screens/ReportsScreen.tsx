import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "../components/Screen";
import { mockApi } from "../services/mockApi";
import { colors, fonts, radii, shadows } from "../theme/tokens";
import { DocumentItem, Expense, Lead, ReportCard } from "../types/models";

export function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [downloadText, setDownloadText] = useState("No report download yet.");
  const { width } = useWindowDimensions();

  useEffect(() => {
    async function loadData() {
      const [reportData, docsData, expenseData, leadData] = await Promise.all([
        mockApi.getReportCards(),
        mockApi.getDocuments(),
        mockApi.getExpenses(),
        mockApi.getLeads()
      ]);
      setReports(reportData);
      setDocs(docsData);
      setExpenses(expenseData);
      setLeads(leadData);
      setLoading(false);
    }

    loadData();
  }, []);

  const reportWidth = useMemo(() => (width >= 420 ? "48%" : "100%"), [width]);

  const onDownload = async (reportId: string) => {
    const result = await mockApi.downloadReport(reportId);
    setDownloadText(`${result.fileName} is ${result.status}`);
  };

  if (loading) {
    return (
      <Screen title="Reports and Documents" subtitle="Accounting and excel exports">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen title="Reports and Documents" subtitle="Accounting | Excel Reports | Centralized records">
      <LinearGradient colors={["#3A7BFF", "#133CA6"]} style={styles.hero}>
        <Text style={styles.heroTitle}>Accounting and Excel Reports</Text>
        <Text style={styles.heroMeta}>{downloadText}</Text>
      </LinearGradient>

      <View style={styles.reportGrid}>
        {reports.map((report) => (
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
            <Pressable style={[styles.downloadButton, { borderColor: report.accent }]} onPress={() => onDownload(report.id)}>
              <Text style={[styles.downloadText, { color: report.accent }]}>Download Report</Text>
            </Pressable>
          </View>
        ))}
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
                {expense.paidBy} -> {expense.paidTo}
              </Text>
            </View>
            <Text style={styles.amount}>INR {expense.amount.toLocaleString("en-IN")}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Lead Funnel</Text>
        {leads.map((lead) => (
          <View key={lead.id} style={styles.row}>
            <View style={styles.flexOne}>
              <Text style={styles.itemTitle}>{lead.name}</Text>
              <Text style={styles.itemMeta}>{lead.requirements}</Text>
            </View>
            <Text style={styles.itemTag}>{lead.status.replace("_", " ")}</Text>
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
    alignItems: "center"
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
