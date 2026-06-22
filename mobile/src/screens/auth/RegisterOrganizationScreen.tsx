import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import { INDIAN_STATES } from "../../lib/constants";
import { colors, spacing } from "../../lib/theme";
import type { AuthStackParamList } from "../../navigation/types";
import type { OrgType } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SelectField } from "../../components/ui/SelectField";
import { Card } from "../../components/ui/Card";
import { LocateButton } from "../../components/LocateButton";

type Props = NativeStackScreenProps<AuthStackParamList, "RegisterOrganization">;

const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ label: s, value: s }));

export function RegisterOrganizationScreen({ navigation }: Props) {
  const { registerOrganization } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    phone: "",
    name: "",
    type: "" as OrgType | "",
    regNumber: "",
    contactPerson: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError("");
    if (!coords) {
      setError("Please set your organization's location.");
      return;
    }
    if (!form.type) {
      setError("Please select an organization type.");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerOrganization({
        email: form.email,
        password: form.password,
        phone: form.phone,
        name: form.name,
        type: form.type,
        regNumber: form.regNumber,
        contactPerson: form.contactPerson,
        lat: coords.lat,
        lng: coords.lng,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Register a Hospital or Blood Bank</Text>
      <Text style={styles.subtitle}>Verified organizations can post emergency requests and manage blood inventory.</Text>

      <Card style={styles.card}>
        <Input label="Organization name" value={form.name} onChangeText={update("name")} />
        <SelectField
          label="Type"
          value={form.type}
          onChange={update("type")}
          options={[
            { label: "Hospital", value: "HOSPITAL" },
            { label: "Blood Bank", value: "BLOOD_BANK" },
          ]}
        />
        <Input label="Registration number" value={form.regNumber} onChangeText={update("regNumber")} />
        <Input label="Contact person" value={form.contactPerson} onChangeText={update("contactPerson")} />
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

        <Input label="Address" value={form.address} onChangeText={update("address")} />
        <Input label="City" value={form.city} onChangeText={update("city")} />
        <SelectField label="State" value={form.state} onChange={update("state")} options={STATE_OPTIONS} searchable />
        <Input label="Pincode" keyboardType="numeric" value={form.pincode} onChangeText={update("pincode")} />

        <LocateButton onLocate={setCoords} />
        {coords && (
          <Text style={styles.locatedText}>
            Location set ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
          </Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
        <Button onPress={handleSubmit} isLoading={isSubmitting}>
          Create organization account
        </Button>
        <Text style={styles.footnote}>
          New organizations start unverified. An administrator will verify your registration shortly.
        </Text>
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
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  card: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  locatedText: {
    fontSize: 12,
    color: colors.success,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  footnote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
  },
});
