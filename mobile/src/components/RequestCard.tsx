import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BloodGroupBadge, RequestStatusBadge, UrgencyBadge } from "./Badges";
import { Card } from "./ui/Card";
import { colors, spacing, typography } from "../lib/theme";
import type { EmergencyRequest } from "../lib/types";

function timeRemaining(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return `${Math.max(1, Math.floor(diffMs / (1000 * 60)))}m left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

export function RequestCard({ request, onPress }: { request: EmergencyRequest; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.flex1}>
            <Text style={styles.title}>{request.organization?.name ?? "Organization"}</Text>
            <Text style={styles.subtitle}>{request.organization?.city ?? request.address}</Text>
          </View>
          <BloodGroupBadge group={request.bloodGroup} />
        </View>
        <View style={styles.badgeRow}>
          <UrgencyBadge urgency={request.urgency} />
          <RequestStatusBadge status={request.status} />
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.muted}>
            {request.unitsFulfilled}/{request.unitsNeeded} units fulfilled
          </Text>
          <Text style={styles.timeLeft}>{timeRemaining(request.expiresAt)}</Text>
        </View>
        {request.distanceKm !== undefined && <Text style={styles.distance}>~{request.distanceKm} km away</Text>}
      </Card>
    </Pressable>
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
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  muted: {
    ...typography.label,
    color: colors.textSecondary,
  },
  timeLeft: {
    ...typography.label,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  distance: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
