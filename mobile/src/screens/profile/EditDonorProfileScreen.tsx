import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
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
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    donor ? { lat: donor.lat, lng: donor.lng } : null
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!donor) return <Spinner />;

  const update = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

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
