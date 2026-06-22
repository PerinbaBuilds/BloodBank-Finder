import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../../lib/theme";
import type { AuthStackParamList } from "../../navigation/types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

type Props = NativeStackScreenProps<AuthStackParamList, "RegisterChoice">;

export function RegisterChoiceScreen({ navigation }: Props) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Create an account</Text>
      <Text style={styles.subtitle}>Choose how you'd like to join BloodBank Finder.</Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>I want to donate blood</Text>
        <Text style={styles.cardText}>Register as a voluntary donor and get notified about nearby requests.</Text>
        <Button onPress={() => navigation.navigate("RegisterDonor")}>Register as Donor</Button>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>I represent a hospital or blood bank</Text>
        <Text style={styles.cardText}>Post emergency requests and manage blood inventory.</Text>
        <Button variant="outline" onPress={() => navigation.navigate("RegisterOrganization")}>
          Register Organization
        </Button>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  card: {
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
