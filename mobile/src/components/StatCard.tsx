import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../lib/theme";

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "30%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  value: {
    ...typography.h2,
    fontWeight: "800",
    color: colors.primary,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
});
