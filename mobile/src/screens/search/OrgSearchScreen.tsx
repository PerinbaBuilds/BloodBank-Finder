import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ApiError, organizationsApi } from "../../lib/api";
import { BLOOD_GROUPS } from "../../lib/constants";
import { colors, spacing } from "../../lib/theme";
import type { BloodGroupLabel, OrganizationWithInventory, OrgType } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SelectField } from "../../components/ui/SelectField";
import { Card } from "../../components/ui/Card";
import { OrgCard } from "../../components/OrgCard";
import { LocateButton } from "../../components/LocateButton";

const RADIUS_OPTIONS = ["5", "10", "25", "50", "100"];

export function OrgSearchScreen() {
  const [city, setCity] = useState("");
  const [type, setType] = useState<OrgType | "">("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroupLabel | "">("");
  const [radiusKm, setRadiusKm] = useState("25");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<OrganizationWithInventory[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setError("");
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
      setError(err instanceof ApiError ? err.message : "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Find a hospital or blood bank</Text>
      <Text style={styles.subtitle}>Search verified organizations by city, blood type, or your current location.</Text>

      <Card style={styles.card}>
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
        <SelectField label="Radius (km)" value={radiusKm} onChange={setRadiusKm} options={RADIUS_OPTIONS.map((r) => ({ label: `${r} km`, value: r }))} />

        <LocateButton onLocate={setCoords} />
        {coords && (
          <Text style={styles.locatedText}>
            Using your location ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
          </Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
        <Button onPress={handleSearch} isLoading={isSearching}>
          Search
        </Button>
      </Card>

      {results && (
        <View style={styles.list}>
          {results.length === 0 ? (
            <Text style={styles.mutedText}>No matching organizations found. Try widening your search.</Text>
          ) : (
            results.map((org) => <OrgCard key={org.id} org={org} />)
          )}
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
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  card: {
    gap: spacing.md,
  },
  locatedText: {
    fontSize: 12,
    color: colors.success,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  list: {
    gap: spacing.md,
  },
  mutedText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
