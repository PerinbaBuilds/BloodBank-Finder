import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { donorsApi } from "../../lib/api";
import { colors, spacing, typography } from "../../lib/theme";
import type { DonationHistoryItem } from "../../lib/types";
import { BloodGroupBadge } from "../../components/Badges";
import { Card } from "../../components/ui/Card";
import { Spinner } from "../../components/ui/Spinner";

export function DonationHistoryScreen() {
  const [donations, setDonations] = useState<DonationHistoryItem[] | null>(null);

  useEffect(() => {
    donorsApi
      .getMyDonations()
      .then(setDonations)
      .catch(() => setDonations([]));
  }, []);

  if (donations === null) return <Spinner />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your donation history</Text>
      <Text style={styles.subtitle}>Every completed donation that helped save a life.</Text>

      {donations.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.mutedText}>
            You haven't completed a donation yet. Browse open requests to find one near you.
          </Text>
        </Card>
      ) : (
        <>
          <Text style={styles.countText}>
            {donations.length} completed donation{donations.length === 1 ? "" : "s"}
          </Text>
          <View style={styles.list}>
            {donations.map((donation) => (
              <Card key={donation.id} style={styles.donationCard}>
                <View style={styles.donationHeaderRow}>
                  <Text style={styles.orgName}>{donation.organization.name}</Text>
                  <BloodGroupBadge group={donation.bloodGroup} />
                </View>
                <Text style={styles.donationMeta}>
                  {donation.organization.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"} ·{" "}
                  {donation.organization.city} · ~{donation.distanceKm} km away
                </Text>
                <Text style={styles.donationDate}>{new Date(donation.donatedAt).toLocaleDateString()}</Text>
              </Card>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: "center",
    gap: spacing.xs,
  },
  mutedText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  countText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.sm,
  },
  donationCard: {
    gap: 4,
  },
  donationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  orgName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  donationMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  donationDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
