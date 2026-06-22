import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import { colors, spacing } from "../../lib/theme";
import type { AuthStackParamList } from "../../navigation/types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to manage your donations or requests.</Text>

      <Card style={styles.card}>
        <Input
          label="Email"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Button onPress={handleSubmit} isLoading={isSubmitting}>
          Login
        </Button>
      </Card>

      <Button variant="ghost" onPress={() => navigation.navigate("RegisterChoice")}>
        Don't have an account? Register
      </Button>

      <Card style={styles.demoCard}>
        <Text style={styles.demoTitle}>Demo credentials</Text>
        <Text style={styles.demoText}>All demo accounts use password: Password123!</Text>
        <Text style={styles.demoText}>Admin: admin@bloodbankfinder.org</Text>
        <Text style={styles.demoText}>Blood bank: central@bloodbank.demo</Text>
        <Text style={styles.demoText}>Hospital: mylapore@hospital.demo</Text>
        <Text style={styles.demoText}>Donor: donor1@demo.com</Text>
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
    paddingTop: spacing.xxl,
    gap: spacing.md,
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
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  demoCard: {
    backgroundColor: colors.surface,
    gap: 2,
    marginTop: spacing.lg,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  demoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
