import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ApiError, requestsApi } from "../../lib/api";
import { BLOOD_GROUPS } from "../../lib/constants";
import { colors, spacing, typography } from "../../lib/theme";
import type { BloodGroupLabel, Urgency } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { SelectField } from "../../components/ui/SelectField";
import { Card } from "../../components/ui/Card";
import { LocateButton } from "../../components/LocateButton";

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map((g) => ({ label: g, value: g }));
const EXPIRY_OPTIONS = ["6", "12", "24", "48", "72"].map((h) => ({ label: `${h} hours`, value: h }));

export function NewRequestScreen({ navigation }: Props) {
  const [form, setForm] = useState({
    bloodGroup: "" as BloodGroupLabel | "",
    unitsNeeded: "1",
    urgency: "" as Urgency | "",
    patientInfo: "",
    notes: "",
    address: "",
    expiresInHours: "24",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.bloodGroup || !form.urgency) {
      setError("Please select a blood group and urgency level.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { request } = await requestsApi.create({
        bloodGroup: form.bloodGroup,
        unitsNeeded: Number(form.unitsNeeded),
        urgency: form.urgency,
        patientInfo: form.patientInfo || undefined,
        notes: form.notes || undefined,
        address: form.address || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        expiresInHours: Number(form.expiresInHours),
      });
      navigation.replace("RequestDetail", { id: request.id });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Post an emergency blood request</Text>
      <Text style={styles.subtitle}>Compatible donors near your location will be notified instantly.</Text>

      <Card style={styles.card}>
        <SelectField label="Blood group needed" value={form.bloodGroup} onChange={update("bloodGroup")} options={BLOOD_GROUP_OPTIONS} />
        <Input label="Units needed" keyboardType="numeric" value={form.unitsNeeded} onChangeText={update("unitsNeeded")} />
        <SelectField
          label="Urgency"
          value={form.urgency}
          onChange={update("urgency")}
          options={[
            { label: "Critical", value: "CRITICAL" },
            { label: "High", value: "HIGH" },
            { label: "Moderate", value: "MODERATE" },
          ]}
        />

        <Textarea label="Patient info (optional)" value={form.patientInfo} onChangeText={update("patientInfo")} />
        <Textarea label="Notes for donors (optional)" value={form.notes} onChangeText={update("notes")} />

        <Input
          label="Address (optional)"
          hint="Leave blank to use your organization's registered address"
          value={form.address}
          onChangeText={update("address")}
        />

        <LocateButton onLocate={setCoords} />
        <Text style={coords ? styles.locatedText : styles.hintText}>
          {coords
            ? `Location set (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
            : "Leave unset to use your organization's registered location."}
        </Text>

        <SelectField label="Expires in" value={form.expiresInHours} onChange={update("expiresInHours")} options={EXPIRY_OPTIONS} />

        {error && <Text style={styles.errorText}>{error}</Text>}
        <Button onPress={handleSubmit} isLoading={isSubmitting}>
          Post request
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
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  card: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  locatedText: {
    ...typography.caption,
    color: colors.success,
  },
  hintText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
});
