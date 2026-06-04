import React, { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";
import { Edge, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "../utils/scale";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showHeader?: boolean;
  safeAreaEdges?: Edge[];
  reserveTabBarSpace?: boolean;
  scrollable?: boolean;
  bottomComponent?: ReactNode;
};

export function Screen({
  title,
  subtitle,
  children,
  showHeader = true,
  safeAreaEdges = ["top", "left", "right"],
  reserveTabBarSpace = true,
  scrollable = true,
  bottomComponent,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(verticalScale(10))).current;
  const bottomPadding = reserveTabBarSpace
    ? verticalScale(96)
    : Math.max(insets.bottom, verticalScale(16));
  const scrollBottomPadding = bottomComponent ? verticalScale(12) : bottomPadding;

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

  const content = (
    <>
      {showHeader ? (
        <LinearGradient colors={[colors.heroStart, colors.heroEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </LinearGradient>
      ) : null}
      <Animated.View
        style={[
          styles.body,
          !scrollable && styles.bodyStatic,
          showHeader ? styles.bodyWithHeader : styles.bodyCompact,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        {children}
      </Animated.View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={safeAreaEdges}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.contentStatic, { paddingBottom: bottomPadding }]}>
          {content}
        </View>
      )}
      {bottomComponent ? (
        <View style={[styles.bottomComponent, { paddingBottom: bottomPadding }]}>
          {bottomComponent}
        </View>
      ) : null}
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
  },
  contentStatic: {
    flex: 1,
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
  bodyStatic: {
    flex: 1,
  },
  bodyWithHeader: {
    marginTop: verticalScale(10),
  },
  bodyCompact: {
    marginTop: verticalScale(10),
  },
  bottomComponent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.page,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
  }
});
