import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useAuth } from "../../context/AuthContext";
import { ApiError, donorsApi, requestsApi } from "../../lib/api";
import { colors, spacing, typography } from "../../lib/theme";
import type { AppTabParamList, HomeStackParamList } from "../../navigation/types";
import type { EmergencyRequest } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Spinner } from "../../components/ui/Spinner";
import { RequestCard } from "../../components/RequestCard";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeRoot">;

export function DonorHomeScreen({ navigation }: Props) {
  const { donor, refresh } = useAuth();
  const [requests, setRequests] = useState<EmergencyRequest[] | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!donor) return;
    requestsApi
      .list({ status: "OPEN", compatibleWithDonorBloodGroup: donor.bloodGroup, lat: donor.lat, lng: donor.lng })
      .then(setRequests)
      .catch(() => setRequests([]));
  }, [donor]);

  if (!donor) return <Spinner />;

  const toggleAvailability = async () => {
    setError("");
    setIsToggling(true);
    try {
      await donorsApi.updateMe({ isAvailable: !donor.isAvailable });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update availability.");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Welcome, {donor.fullName}</Text>
      <Text style={styles.subtitle}>
        {donor.bloodGroup} donor in {donor.city}
      </Text>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{donor.totalDonations}</Text>
          <Text style={styles.statLabel}>Total donations</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>
            {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : "—"}
          </Text>
          <Text style={styles.statLabel}>Last donation</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: donor.eligibility.isEligible ? colors.success : colors.warning }]}>
            {donor.eligibility.isEligible ? "Eligible" : "Not eligible"}
          </Text>
          <Text style={styles.statLabel}>{donor.eligibility.reason ?? "You can donate now"}</Text>
        </Card>
      </View>

      <Card style={styles.availabilityCard}>
        <View style={styles.flex1}>
          <Text style={styles.cardTitle}>Availability</Text>
          <Text style={styles.cardText}>
            {donor.isAvailable
              ? "You're visible to hospitals searching for donors."
              : "You're hidden from donor searches."}
          </Text>
        </View>
        <Button variant={donor.isAvailable ? "secondary" : "primary"} isLoading={isToggling} onPress={toggleAvailability}>
          {donor.isAvailable ? "Set unavailable" : "Set available"}
        </Button>
      </Card>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Requests matching your blood group</Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => (navigation.getParent() as BottomTabNavigationProp<AppTabParamList> | undefined)?.navigate("Requests")}
          >
            View all
          </Button>
        </View>
        <View style={styles.list}>
          {requests === null ? (
            <Spinner />
          ) : requests.length === 0 ? (
            <Text style={styles.mutedText}>No matching open requests right now. We'll notify you when one appears.</Text>
          ) : (
            requests
              .slice(0, 4)
              .map((request) => (
                <RequestCard key={request.id} request={request} onPress={() => navigation.navigate("RequestDetail", { id: request.id })} />
              ))
          )}
        </View>
      </View>
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
  flex1: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statCard: {
    flexBasis: "31%",
    flexGrow: 1,
    alignItems: "center",
  },
  statValue: {
    ...typography.h2,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  availabilityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  cardText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  mutedText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
