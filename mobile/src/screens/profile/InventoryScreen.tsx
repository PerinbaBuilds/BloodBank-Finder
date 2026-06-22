import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ApiError, inventoryApi } from "../../lib/api";
import { BLOOD_GROUPS } from "../../lib/constants";
import { colors, spacing } from "../../lib/theme";
import type { BloodGroupLabel } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Spinner } from "../../components/ui/Spinner";

function emptyUnits(): Record<BloodGroupLabel, string> {
  return Object.fromEntries(BLOOD_GROUPS.map((g) => [g, "0"])) as Record<BloodGroupLabel, string>;
}

export function InventoryScreen() {
  const [units, setUnits] = useState<Record<BloodGroupLabel, string> | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    inventoryApi
      .getMine()
      .then((items) => {
        const map = emptyUnits();
        for (const item of items) map[item.bloodGroup] = String(item.units);
        setUnits(map);
      })
      .catch(() => setUnits(emptyUnits()));
  }, []);

  if (!units) return <Spinner />;

  const update = (group: BloodGroupLabel) => (value: string) =>
    setUnits((prev) => (prev ? { ...prev, [group]: value } : prev));

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);
    setIsSaving(true);
    try {
      await inventoryApi.upsertMine(BLOOD_GROUPS.map((g) => ({ bloodGroup: g, units: Number(units[g]) || 0 })));
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save inventory.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Manage blood inventory</Text>
      <Text style={styles.subtitle}>
        Keep your stock levels current so hospitals and donors see accurate availability.
      </Text>

      <Card style={styles.card}>
        <View style={styles.grid}>
          {BLOOD_GROUPS.map((group) => (
            <View key={group} style={styles.gridItem}>
              <Input label={`${group} (units)`} keyboardType="numeric" value={units[group]} onChangeText={update(group)} />
            </View>
          ))}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>Inventory updated.</Text>}
        <Button onPress={handleSubmit} isLoading={isSaving}>
          Save inventory
        </Button>
      </Card>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  gridItem: {
    width: "47%",
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  successText: {
    fontSize: 13,
    color: colors.success,
  },
});
