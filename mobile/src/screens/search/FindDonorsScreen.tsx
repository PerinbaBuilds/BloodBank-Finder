import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { ApiError, donorsApi } from "../../lib/api";
import { BLOOD_GROUPS } from "../../lib/constants";
import { colors, spacing, typography } from "../../lib/theme";
import type { BloodGroupLabel, DonorPublic } from "../../lib/types";
import { BloodGroupBadge } from "../../components/Badges";
import { Button } from "../../components/ui/Button";
import { SelectField } from "../../components/ui/SelectField";
import { Card } from "../../components/ui/Card";
import { LocateButton } from "../../components/LocateButton";

const RADIUS_OPTIONS = ["5", "10", "15", "25", "50", "100", "200"];

export function FindDonorsScreen() {
  const { organization } = useAuth();
  const [bloodGroup, setBloodGroup] = useState<BloodGroupLabel | "">("");
  const [radiusKm, setRadiusKm] = useState("15");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    organization ? { lat: organization.lat, lng: organization.lng } : null
  );
  const [results, setResults] = useState<DonorPublic[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setError("");
    if (!bloodGroup) {
      setError("Select a blood group to search.");
      return;
    }
    if (!coords) {
      setError("Set a location to search for donors.");
      return;
    }
    setIsSearching(true);
    try {
      const data = await donorsApi.search({ bloodGroup, lat: coords.lat, lng: coords.lng, radiusKm: Number(radiusKm) });
      setResults(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Find available donors</Text>
      <Text style={styles.subtitle}>
        See how many compatible, available donors are nearby. To contact a donor, post an emergency request — contact
        details are shared automatically once a donor responds and you confirm them.
      </Text>

      <Card style={styles.card}>
        <SelectField
          label="Blood group"
          value={bloodGroup}
          onChange={(v) => setBloodGroup(v as BloodGroupLabel | "")}
          options={BLOOD_GROUPS.map((g) => ({ label: g, value: g }))}
        />
        <SelectField label="Radius (km)" value={radiusKm} onChange={setRadiusKm} options={RADIUS_OPTIONS.map((r) => ({ label: `${r} km`, value: r }))} />

        <LocateButton onLocate={setCoords} />
        {coords && (
          <Text style={styles.locatedText}>
            Searching near ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
          </Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
        <Button onPress={handleSearch} isLoading={isSearching}>
          Search
        </Button>
      </Card>

      {results && (
        <View style={styles.results}>
          <Text style={styles.resultsHeader}>
            {results.length} available, eligible donor(s) found within {radiusKm} km
          </Text>
          <View style={styles.list}>
            {results.map((donor) => (
              <Card key={donor.id} style={styles.donorCard}>
                <View>
                  <BloodGroupBadge group={donor.bloodGroup} />
                  <Text style={styles.donorCity}>{donor.city}</Text>
                </View>
                {donor.distanceKm !== undefined && <Text style={styles.donorDistance}>~{donor.distanceKm} km</Text>}
              </Card>
            ))}
          </View>
        </View>
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
  card: {
    gap: spacing.md,
  },
  locatedText: {
    ...typography.caption,
    color: colors.success,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
  results: {
    gap: spacing.sm,
  },
  resultsHeader: {
    ...typography.label,
    color: colors.textPrimary,
  },
  list: {
    gap: spacing.sm,
  },
  donorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  donorCity: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  donorDistance: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
