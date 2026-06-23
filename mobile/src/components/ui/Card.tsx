import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius, shadows, spacing } from "../../lib/theme";

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    ...shadows.sm,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#f0f0f1",
    padding: spacing.lg,
  },
});
