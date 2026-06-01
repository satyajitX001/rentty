import React, { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "../utils/scale";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showHeader?: boolean;
};

export function Screen({ title, subtitle, children, showHeader = true }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(verticalScale(10))).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(verticalScale(10));
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, title]);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showHeader ? (
          <LinearGradient colors={[colors.heroStart, colors.heroEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerWrap}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </LinearGradient>
        ) : null}
        <Animated.View
          style={[
            styles.body,
            showHeader ? styles.bodyWithHeader : styles.bodyCompact,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          {children}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, fonts, radii, shadows }: AppTheme) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page
  },
  content: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(96)
  },
  headerWrap: {
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    gap: verticalScale(5)
  },
  title: {
    fontSize: moderateScale(24),
    color: "#FFFFFF",
    fontFamily: fonts.display,
    letterSpacing: 0.1
  },
  subtitle: {
    fontSize: moderateScale(13),
    color: "#DBE7FF",
    fontFamily: fonts.body
  },
  body: {
    gap: verticalScale(12)
  },
  bodyWithHeader: {
    marginTop: verticalScale(10),
  },
  bodyCompact: {
    marginTop: verticalScale(10),
  }
});
