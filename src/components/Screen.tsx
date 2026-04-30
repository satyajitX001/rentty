import React, { ReactNode } from "react";
import {  ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "../theme/tokens";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function Screen({ title, subtitle, children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.heroStart, colors.heroEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </LinearGradient>
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 30
  },
  headerWrap: {
    marginTop: 6,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 5
  },
  title: {
    fontSize: 24,
    color: "#FFFFFF",
    fontFamily: fonts.display,
    letterSpacing: 0.1
  },
  subtitle: {
    fontSize: 13,
    color: "#DBE7FF",
    fontFamily: fonts.body
  },
  body: {
    marginTop: 14,
    gap: 12
  }
});
