import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { requestsApi } from "../../lib/api";
import { colors, spacing, typography } from "../../lib/theme";
import type { HomeStackParamList } from "../../navigation/types";
import type { EmergencyRequest } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Spinner } from "../../components/ui/Spinner";
import { RequestCard } from "../../components/RequestCard";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeRoot">;

export function OrganizationHomeScreen({ navigation }: Props) {
  const { organization, user } = useAuth();
  const [requests, setRequests] = useState<EmergencyRequest[] | null>(null);

  useEffect(() => {
    requestsApi
      .list({ mine: true })
      .then(setRequests)
      .catch(() => setRequests([]));
  }, []);

  if (!organization) return <Spinner />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{organization.name}</Text>
      <Text style={styles.subtitle}>
        {organization.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"} · {organization.city}
      </Text>
      <Text style={organization.isVerified ? styles.verified : styles.unverified}>
        {organization.isVerified
          ? "Verified"
          : "Pending verification — you can still post requests while an admin reviews your account."}
      </Text>

      <Button onPress={() => navigation.navigate("NewRequest")}>New emergency request</Button>

      <View style={styles.actionsRow}>
        {user?.role === "BLOOD_BANK" && (
          <Button
            variant="outline"
            size="sm"
            onPress={() => navigation.getParent()?.navigate("Profile", { screen: "Inventory" } as never)}
          >
            Manage inventory
          </Button>
        )}
        <Button variant="outline" size="sm" onPress={() => navigation.getParent()?.navigate("Search" as never)}>
          Find donors
        </Button>
        <Button variant="outline" size="sm" onPress={() => navigation.getParent()?.navigate("Requests" as never)}>
          All requests
        </Button>
        <Button
          variant="outline"
          size="sm"
          onPress={() => navigation.getParent()?.navigate("Profile", { screen: "AmbulanceFleet" } as never)}
        >
          Ambulances
        </Button>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your recent requests</Text>
        <View style={styles.list}>
          {requests === null ? (
            <Spinner />
          ) : requests.length === 0 ? (
            <Card>
              <Text style={styles.mutedText}>You haven't posted any emergency requests yet.</Text>
            </Card>
          ) : (
            requests
              .slice(0, 6)
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
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  verified: {
    ...typography.label,
    color: colors.success,
  },
  unverified: {
    ...typography.label,
    color: colors.warning,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  section: {
    marginTop: spacing.md,
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
