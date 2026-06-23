import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import { BLOOD_GROUPS, INDIAN_STATES } from "../../lib/constants";
import { colors, spacing, typography } from "../../lib/theme";
import type { AuthStackParamList } from "../../navigation/types";
import type { BloodGroupLabel, Gender } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { SelectField } from "../../components/ui/SelectField";
import { Card } from "../../components/ui/Card";
import { Toggle } from "../../components/ui/Toggle";
import { LocateButton } from "../../components/LocateButton";

type Props = NativeStackScreenProps<AuthStackParamList, "RegisterDonor">;

const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ label: s, value: s }));
const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map((g) => ({ label: g, value: g }));

export function RegisterDonorScreen({ navigation }: Props) {
  const { registerDonor } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    phone: "",
    fullName: "",
    bloodGroup: "" as BloodGroupLabel | "",
    gender: "" as Gender | "",
    dateOfBirth: "",
    weightKg: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isSmoker: false,
    isAlcoholic: false,
    usesDrugs: false,
    hasChronicIllness: false,
    chronicIllnessDetails: "",
    hasGeneticDisorder: false,
    geneticDisorderDetails: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggle = (key: keyof typeof form) => (value: boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError("");
    if (!coords) {
      setError("Please set your location so nearby hospitals can find you.");
      return;
    }
    if (!form.bloodGroup || !form.gender) {
      setError("Please select your blood group and gender.");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerDonor({
        email: form.email,
        password: form.password,
        phone: form.phone,
        fullName: form.fullName,
        bloodGroup: form.bloodGroup,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        weightKg: Number(form.weightKg),
        lat: coords.lat,
        lng: coords.lng,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        isSmoker: form.isSmoker,
        isAlcoholic: form.isAlcoholic,
        usesDrugs: form.usesDrugs,
        hasChronicIllness: form.hasChronicIllness,
        chronicIllnessDetails: form.hasChronicIllness ? form.chronicIllnessDetails || undefined : undefined,
        hasGeneticDisorder: form.hasGeneticDisorder,
        geneticDisorderDetails: form.hasGeneticDisorder ? form.geneticDisorderDetails || undefined : undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Register as a Donor</Text>
      <Text style={styles.subtitle}>Join our network of voluntary donors and help save lives in your community.</Text>

      <Card style={styles.card}>
        <Input label="Full name" value={form.fullName} onChangeText={update("fullName")} />
        <Input label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={update("phone")} />
        <Input label="Email" keyboardType="email-address" autoComplete="email" value={form.email} onChangeText={update("email")} />
        <Input
          label="Password"
          secureTextEntry
          hint="At least 8 characters"
          autoComplete="password-new"
          value={form.password}
          onChangeText={update("password")}
        />
        <SelectField label="Blood group" value={form.bloodGroup} onChange={update("bloodGroup")} options={BLOOD_GROUP_OPTIONS} />
        <SelectField
          label="Gender"
          value={form.gender}
          onChange={update("gender")}
          options={[
            { label: "Male", value: "MALE" },
            { label: "Female", value: "FEMALE" },
            { label: "Other", value: "OTHER" },
          ]}
        />
        <Input label="Weight (kg)" keyboardType="numeric" value={form.weightKg} onChangeText={update("weightKg")} />
        <Input
          label="Date of birth"
          placeholder="YYYY-MM-DD"
          value={form.dateOfBirth}
          onChangeText={update("dateOfBirth")}
        />

        <Input label="Address" value={form.address} onChangeText={update("address")} />
        <Input label="City" value={form.city} onChangeText={update("city")} />
        <SelectField label="State" value={form.state} onChange={update("state")} options={STATE_OPTIONS} searchable />
        <Input label="Pincode" keyboardType="numeric" value={form.pincode} onChangeText={update("pincode")} />

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
        <Button onPress={handleSubmit} isLoading={isSubmitting}>
          Create donor account
        </Button>
      </Card>

      <Button variant="ghost" onPress={() => navigation.navigate("Login")}>
        Already have an account? Login
      </Button>
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
    paddingTop: spacing.xl,
    gap: spacing.md,
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
});
