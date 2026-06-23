import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError, organizationsApi, statsApi } from "../../lib/api";
import { BLOOD_GROUPS } from "../../lib/constants";
import { colors, spacing, typography } from "../../lib/theme";
import type { AuthStackParamList } from "../../navigation/types";
import type { BloodGroupLabel, OrganizationWithInventory, OrgType, StatsOverview } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SelectField } from "../../components/ui/SelectField";
import { Card } from "../../components/ui/Card";
import { Logo } from "../../components/ui/Logo";
import { StatCard } from "../../components/StatCard";
import { OrgCard } from "../../components/OrgCard";
import { LocateButton } from "../../components/LocateButton";

const RADIUS_OPTIONS = ["5", "10", "25", "50", "100"];

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [city, setCity] = useState("");
  const [type, setType] = useState<OrgType | "">("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroupLabel | "">("");
  const [radiusKm, setRadiusKm] = useState("25");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<OrganizationWithInventory[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    statsApi.overview().then(setStats).catch(() => undefined);
  }, []);

  const handleSearch = async () => {
    setSearchError("");
    setIsSearching(true);
    try {
      const data = await organizationsApi.search({
        type: type || undefined,
        bloodGroup: bloodGroup || undefined,
        city: city || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        radiusKm: coords ? Number(radiusKm) : undefined,
      });
      setResults(data);
    } catch (err) {
      setSearchError(err instanceof ApiError ? err.message : "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Logo />
      <Text style={styles.heroTitle}>Find blood when every minute counts.</Text>
      <Text style={styles.heroSubtitle}>
        BloodBank Finder connects voluntary donors, hospitals, and blood banks in real time to resolve urgent blood
        shortages — wherever you are.
      </Text>

      <View style={styles.ctaRow}>
        <Button onPress={() => navigation.navigate("RegisterDonor")} style={styles.flex1}>
          Become a Donor
        </Button>
        <Button variant="outline" onPress={() => navigation.navigate("RegisterOrganization")} style={styles.flex1}>
          Register Org
        </Button>
      </View>
      <Button variant="ghost" onPress={() => navigation.navigate("Login")}>
        Already have an account? Login
      </Button>

      {stats && (
        <View style={styles.statsGrid}>
          <StatCard label="Donors" value={stats.donorCount} />
          <StatCard label="Blood Banks" value={stats.bloodBankCount} />
          <StatCard label="Hospitals" value={stats.hospitalCount} />
          <StatCard label="Active Requests" value={stats.activeRequests} />
          <StatCard label="Units Fulfilled" value={stats.unitsFulfilled} />
          <StatCard label="Total Donations" value={stats.totalDonations} />
        </View>
      )}

      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>Find a hospital or blood bank near you</Text>
        <Text style={styles.sectionSubtitle}>Search verified organizations by city, blood type, or your location.</Text>

        <Card style={styles.formCard}>
          <Input label="City" placeholder="e.g. Chennai" value={city} onChangeText={setCity} />
          <SelectField
            label="Type"
            value={type}
            onChange={(v) => setType(v as OrgType | "")}
            placeholder="Any"
            options={[
              { label: "Any", value: "" },
              { label: "Hospital", value: "HOSPITAL" },
              { label: "Blood Bank", value: "BLOOD_BANK" },
            ]}
          />
          <SelectField
            label="Blood group in stock"
            value={bloodGroup}
            onChange={(v) => setBloodGroup(v as BloodGroupLabel | "")}
            placeholder="Any"
            options={[{ label: "Any", value: "" }, ...BLOOD_GROUPS.map((g) => ({ label: g, value: g }))]}
          />
          <SelectField
            label="Radius (km)"
            value={radiusKm}
            onChange={setRadiusKm}
            options={RADIUS_OPTIONS.map((r) => ({ label: `${r} km`, value: r }))}
          />

          <View>
            <LocateButton onLocate={setCoords} />
            {coords && (
              <Text style={styles.locatedText}>
                Using your location ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
              </Text>
            )}
          </View>

          {searchError && <Text style={styles.errorText}>{searchError}</Text>}
          <Button onPress={handleSearch} isLoading={isSearching}>
            Search
          </Button>
        </Card>

        {results && (
          <View style={styles.resultsList}>
            {results.length === 0 ? (
              <Text style={styles.mutedText}>No matching organizations found. Try widening your search.</Text>
            ) : (
              results.map((org) => <OrgCard key={org.id} org={org} />)
            )}
          </View>
        )}
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
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  heroTitle: {
    ...typography.display,
    color: colors.textPrimary,
    textAlign: "center",
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  ctaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  flex1: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  searchSection: {
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  formCard: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  locatedText: {
    ...typography.caption,
    color: colors.success,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
  resultsList: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  mutedText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
