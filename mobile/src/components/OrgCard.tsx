import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { BloodGroupBadge } from "./Badges";
import { Card } from "./ui/Card";
import { colors, radius, spacing, typography } from "../lib/theme";
import type { OrganizationWithInventory } from "../lib/types";

export function OrgCard({ org }: { org: OrganizationWithInventory }) {
  const inStock = org.inventory.filter((item) => item.units > 0);
  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.flex1}>
          <Text style={styles.title}>{org.name}</Text>
          <Text style={styles.subtitle}>
            {org.address}, {org.city}
          </Text>
        </View>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{org.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"}</Text>
        </View>
      </View>

      {org.distanceKm !== undefined && <Text style={styles.distance}>~{org.distanceKm} km away</Text>}

      {org.type === "BLOOD_BANK" && (
        <View style={styles.stockRow}>
          {inStock.length === 0 ? (
            <Text style={styles.noStock}>No stock reported</Text>
          ) : (
            inStock.map((item) => (
              <View key={item.id} style={styles.stockItem}>
                <BloodGroupBadge group={item.bloodGroup} />
                <Text style={styles.stockCount}>×{item.units}</Text>
              </View>
            ))
          )}
        </View>
      )}

      <View style={styles.footerRow}>
        {org.isVerified ? (
          <Text style={styles.verified}>Verified</Text>
        ) : (
          <Text style={styles.unverified}>Pending verification</Text>
        )}
        {org.phone && <Text style={styles.muted}>· {org.phone}</Text>}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  typePill: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  typeText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  distance: {
    ...typography.caption,
    color: colors.textMuted,
  },
  stockRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  stockItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stockCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  noStock: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  verified: {
    ...typography.caption,
    color: colors.success,
    fontWeight: "600",
  },
  unverified: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  muted: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
