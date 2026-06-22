import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ApiError, adminApi } from "../../lib/api";
import { colors, spacing } from "../../lib/theme";
import type { Organization } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { SelectField } from "../../components/ui/SelectField";
import { Spinner } from "../../components/ui/Spinner";

type Filter = "unverified" | "verified" | "all";

export function AdminHomeScreen() {
  const [filter, setFilter] = useState<Filter>("unverified");
  const [orgs, setOrgs] = useState<Organization[] | null>(null);
  const [error, setError] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const verified = filter === "all" ? undefined : filter === "verified";
      const data = await adminApi.listOrganizations(verified);
      setOrgs(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load organizations.");
      setOrgs([]);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      await adminApi.verifyOrganization(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not verify this organization.");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Organization verification</Text>
      <SelectField
        value={filter}
        onChange={(v) => setFilter(v as Filter)}
        options={[
          { label: "Pending verification", value: "unverified" },
          { label: "Verified", value: "verified" },
          { label: "All organizations", value: "all" },
        ]}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.list}>
        {orgs === null ? (
          <Spinner />
        ) : orgs.length === 0 ? (
          <Text style={styles.mutedText}>No organizations found.</Text>
        ) : (
          orgs.map((org) => (
            <Card key={org.id} style={styles.orgCard}>
              <View style={styles.flex1}>
                <Text style={styles.orgName}>{org.name}</Text>
                <Text style={styles.orgMeta}>
                  {org.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"} · {org.city} · Reg #{org.regNumber}
                </Text>
                <Text style={styles.orgMeta}>
                  Contact: {org.contactPerson} · {org.phone} · {org.email}
                </Text>
              </View>
              {org.isVerified ? (
                <Text style={styles.verifiedText}>Verified</Text>
              ) : (
                <Button size="sm" isLoading={verifyingId === org.id} onPress={() => handleVerify(org.id)}>
                  Verify
                </Button>
              )}
            </Card>
          ))
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
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  list: {
    gap: spacing.sm,
  },
  orgCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  orgName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  orgMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.success,
  },
  mutedText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
