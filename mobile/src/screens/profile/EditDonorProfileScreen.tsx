import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { ApiError, donorsApi } from "../../lib/api";
import { BLOOD_GROUPS, INDIAN_STATES } from "../../lib/constants";
import { colors, spacing, typography } from "../../lib/theme";
import type { BloodGroupLabel } from "../../lib/types";
import type { ProfileStackParamList } from "../../navigation/types";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { SelectField } from "../../components/ui/SelectField";
import { Card } from "../../components/ui/Card";
import { Toggle } from "../../components/ui/Toggle";
import { LocateButton } from "../../components/LocateButton";
import { Spinner } from "../../components/ui/Spinner";

type Props = NativeStackScreenProps<ProfileStackParamList, "EditDonorProfile">;

const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map((g) => ({ label: g, value: g }));
const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ label: s, value: s }));

export function EditDonorProfileScreen({ navigation }: Props) {
  const { donor, refresh } = useAuth();
  const [form, setForm] = useState({
    fullName: donor?.fullName ?? "",
    phone: donor?.phone ?? "",
    bloodGroup: (donor?.bloodGroup ?? "") as BloodGroupLabel | "",
    weightKg: donor ? String(donor.weightKg) : "",
    address: donor?.address ?? "",
    city: donor?.city ?? "",
    state: donor?.state ?? "",
    pincode: donor?.pincode ?? "",
    medicalNotes: donor?.medicalNotes ?? "",
    isSmoker: donor?.isSmoker ?? false,
    isAlcoholic: donor?.isAlcoholic ?? false,
    usesDrugs: donor?.usesDrugs ?? false,
    hasChronicIllness: donor?.hasChronicIllness ?? false,
    chronicIllnessDetails: donor?.chronicIllnessDetails ?? "",
    hasGeneticDisorder: donor?.hasGeneticDisorder ?? false,
    geneticDisorderDetails: donor?.geneticDisorderDetails ?? "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    donor ? { lat: donor.lat, lng: donor.lng } : null
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!donor) return <Spinner />;

  const update = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggle = (key: keyof typeof form) => (value: boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await donorsApi.updateMe({
        fullName: form.fullName,
        phone: form.phone,
        bloodGroup: form.bloodGroup || undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        medicalNotes: form.medicalNotes || null,
        isSmoker: form.isSmoker,
        isAlcoholic: form.isAlcoholic,
        usesDrugs: form.usesDrugs,
        hasChronicIllness: form.hasChronicIllness,
        chronicIllnessDetails: form.hasChronicIllness ? form.chronicIllnessDetails || null : null,
        hasGeneticDisorder: form.hasGeneticDisorder,
        geneticDisorderDetails: form.hasGeneticDisorder ? form.geneticDisorderDetails || null : null,
        lat: coords?.lat,
        lng: coords?.lng,
      });
      await refresh();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Edit your profile</Text>
      <Text style={styles.subtitle}>Keep your details up to date so hospitals can reach you quickly.</Text>

      <Card style={styles.card}>
        <Input label="Full name" value={form.fullName} onChangeText={update("fullName")} />
        <Input label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={update("phone")} />
        <SelectField
          label="Blood group"
          value={form.bloodGroup}
          onChange={(v) => setForm((prev) => ({ ...prev, bloodGroup: v as BloodGroupLabel }))}
          options={BLOOD_GROUP_OPTIONS}
        />
        <Input label="Weight (kg)" keyboardType="numeric" value={form.weightKg} onChangeText={update("weightKg")} />
        <Input label="Address" value={form.address} onChangeText={update("address")} />
        <Input label="City" value={form.city} onChangeText={update("city")} />
        <SelectField label="State" value={form.state} onChange={update("state")} options={STATE_OPTIONS} searchable />
        <Input label="Pincode" value={form.pincode} onChangeText={update("pincode")} />
        <Textarea label="Medical notes (optional)" value={form.medicalNotes} onChangeText={update("medicalNotes")} />

        <View style={styles.healthSection}>
          <Text style={styles.healthTitle}>Health &amp; lifestyle</Text>
          <Text style={styles.healthHint}>
            Helps hospitals and blood banks assess donation eligibility. Kept private to your profile.
          </Text>
          <Toggle label="Do you smoke?" value={form.isSmoker} onChange={toggle("isSmoker")} />
          <Toggle label="Do you consume alcohol?" value={form.isAlcoholic} onChange={toggle("isAlcoholic")} />
          <Toggle label="Do you use recreational drugs?" value={form.usesDrugs} onChange={toggle("usesDrugs")} />
          <Toggle
            label="Do you have any chronic illness?"
            value={form.hasChronicIllness}
            onChange={toggle("hasChronicIllness")}
          />
          {form.hasChronicIllness && (
            <Textarea
              label="Please describe the illness"
              value={form.chronicIllnessDetails}
              onChangeText={update("chronicIllnessDetails")}
            />
          )}
          <Toggle
            label="Any known genetic disorder?"
            value={form.hasGeneticDisorder}
            onChange={toggle("hasGeneticDisorder")}
          />
          {form.hasGeneticDisorder && (
            <Textarea
              label="Please describe the disorder"
              value={form.geneticDisorderDetails}
              onChangeText={update("geneticDisorderDetails")}
            />
          )}
        </View>

        <LocateButton onLocate={setCoords} />
        {coords && (
          <Text style={styles.locatedText}>
            Location set ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
          </Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>Profile updated.</Text>}
        <Button onPress={handleSubmit} isLoading={isSubmitting}>
          Save changes
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
  },
  healthSection: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  healthTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  healthHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  locatedText: {
    ...typography.caption,
    color: colors.success,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
  successText: {
    ...typography.caption,
    color: colors.success,
  },
});
