import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { colors, spacing } from "../../lib/theme";
import type { ProfileStackParamList } from "../../navigation/types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileRoot">;

export function ProfileScreen({ navigation }: Props) {
  const { user, donor, organization, logout } = useAuth();

  if (!user) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <Card style={styles.card}>
        {organization ? (
          <>
            <Text style={styles.name}>{organization.name}</Text>
            <Text style={styles.subtext}>
              {organization.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"} · {organization.city}
            </Text>
            <Text style={organization.isVerified ? styles.verified : styles.unverified}>
              {organization.isVerified ? "Verified" : "Pending verification"}
            </Text>
          </>
        ) : donor ? (
          <>
            <Text style={styles.name}>{donor.fullName}</Text>
            <Text style={styles.subtext}>
              {donor.bloodGroup} · {donor.city}
            </Text>
          </>
        ) : (
          <Text style={styles.name}>{user.email}</Text>
        )}
        <View style={styles.divider} />
        <Row label="Email" value={user.email} />
        <Row label="Phone" value={user.phone} />
        <Row label="Role" value={user.role.replace("_", " ")} />
      </Card>

      <View style={styles.actions}>
        {donor && (
          <Button variant="outline" onPress={() => navigation.navigate("EditDonorProfile")}>
            Edit profile
          </Button>
        )}
        {user.role === "BLOOD_BANK" && (
          <Button variant="outline" onPress={() => navigation.navigate("Inventory")}>
            Manage inventory
          </Button>
        )}
        <Button variant="secondary" onPress={() => logout()}>
          Logout
        </Button>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  card: {
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  verified: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
    marginTop: 2,
  },
  unverified: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.warning,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  actions: {
    gap: spacing.sm,
  },
});
