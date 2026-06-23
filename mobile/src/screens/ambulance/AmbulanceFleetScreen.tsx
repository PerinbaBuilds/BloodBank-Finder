import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError, ambulanceRequestsApi, ambulancesApi } from "../../lib/api";
import { colors, spacing, typography } from "../../lib/theme";
import type { ProfileStackParamList } from "../../navigation/types";
import type { Ambulance, AmbulanceRequestItem, AmbulanceRequestStatus } from "../../lib/types";
import { AmbulanceRequestStatusBadge, AmbulanceStatusBadge } from "../../components/Badges";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { SelectField } from "../../components/ui/SelectField";
import { Spinner } from "../../components/ui/Spinner";
import { LocateButton } from "../../components/LocateButton";

type Props = NativeStackScreenProps<ProfileStackParamList, "AmbulanceFleet">;

const NEXT_STATUS: Partial<Record<AmbulanceRequestStatus, { status: AmbulanceRequestStatus; label: string }>> = {
  ASSIGNED: { status: "EN_ROUTE", label: "Mark en route" },
  EN_ROUTE: { status: "ARRIVED", label: "Mark arrived" },
  ARRIVED: { status: "COMPLETED", label: "Mark completed" },
};
const TERMINAL: AmbulanceRequestStatus[] = ["COMPLETED", "CANCELLED"];

function RegisterAmbulanceForm({ onCreated }: { onCreated: (ambulance: Ambulance) => void }) {
  const [form, setForm] = useState({ vehicleNumber: "", driverName: "", driverPhone: "" });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const ambulance = await ambulancesApi.create({ ...form, lat: coords?.lat, lng: coords?.lng });
      onCreated(ambulance);
      setForm({ vehicleNumber: "", driverName: "", driverPhone: "" });
      setCoords(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not register ambulance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card style={styles.formCard}>
      <Text style={styles.cardTitle}>Register a new ambulance</Text>
      <Input
        label="Vehicle number"
        placeholder="TN-09-AB-1234"
        value={form.vehicleNumber}
        onChangeText={update("vehicleNumber")}
      />
      <Input label="Driver name" value={form.driverName} onChangeText={update("driverName")} />
      <Input
        label="Driver phone"
        placeholder="+91-9876543210"
        value={form.driverPhone}
        onChangeText={update("driverPhone")}
      />
      <View>
        <LocateButton onLocate={setCoords} />
        <Text style={coords ? styles.coordsSetText : styles.mutedText}>
          {coords ? `Base location set (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : "Leave unset to use your organization's registered location."}
        </Text>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Button isLoading={isSubmitting} onPress={handleSubmit}>
        Register ambulance
      </Button>
    </Card>
  );
}

function FleetCard({ ambulance, onUpdated }: { ambulance: Ambulance; onUpdated: (a: Ambulance) => void }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const setStatus = async (status: "AVAILABLE" | "OFFLINE") => {
    setIsUpdating(true);
    try {
      const updated = await ambulancesApi.update(ambulance.id, { status });
      onUpdated(updated);
    } catch {
      // surfaced implicitly by the badge not changing; keep UI simple
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card style={styles.fleetCard}>
      <View style={styles.fleetHeaderRow}>
        <Text style={styles.fleetVehicle}>{ambulance.vehicleNumber}</Text>
        <AmbulanceStatusBadge status={ambulance.status} />
      </View>
      <Text style={styles.fleetMeta}>{ambulance.driverName}</Text>
      <Text style={styles.fleetMeta}>{ambulance.driverPhone}</Text>
      {ambulance.status === "AVAILABLE" && (
        <Button size="sm" variant="outline" isLoading={isUpdating} onPress={() => setStatus("OFFLINE")}>
          Take offline
        </Button>
      )}
      {ambulance.status === "OFFLINE" && (
        <Button size="sm" isLoading={isUpdating} onPress={() => setStatus("AVAILABLE")}>
          Set available
        </Button>
      )}
      {ambulance.status === "ON_TRIP" && <Text style={styles.mutedText}>Currently on a trip</Text>}
    </Card>
  );
}

function DispatchCard({
  dispatch,
  availableAmbulances,
  onUpdated,
  onPress,
}: {
  dispatch: AmbulanceRequestItem;
  availableAmbulances: Ambulance[];
  onUpdated: (d: AmbulanceRequestItem) => void;
  onPress: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isTerminal = TERMINAL.includes(dispatch.status);
  const next = NEXT_STATUS[dispatch.status];

  const assign = async (ambulanceId: string) => {
    if (!ambulanceId) return;
    setIsUpdating(true);
    try {
      const updated = await ambulanceRequestsApi.update(dispatch.id, { ambulanceId });
      onUpdated(updated);
    } catch {
      // ignore; list will simply not reflect the change
    } finally {
      setIsUpdating(false);
    }
  };

  const advance = async (status: AmbulanceRequestStatus) => {
    setIsUpdating(true);
    try {
      const updated = await ambulanceRequestsApi.update(dispatch.id, { status });
      onUpdated(updated);
    } catch {
      // ignore
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.dispatchCard}>
        <View style={styles.dispatchHeaderRow}>
          <View style={styles.flex1}>
            <Text style={styles.dispatchAddress}>{dispatch.pickupAddress}</Text>
            <Text style={styles.fleetMeta}>→ {dispatch.dropoffAddress}</Text>
          </View>
          <AmbulanceRequestStatusBadge status={dispatch.status} />
        </View>

        {dispatch.ambulance ? (
          <Text style={styles.fleetMeta}>
            {dispatch.ambulance.vehicleNumber} · {dispatch.ambulance.driverName}
          </Text>
        ) : (
          !isTerminal && (
            <SelectField
              value=""
              onChange={assign}
              options={availableAmbulances.map((a) => ({ value: a.id, label: `${a.vehicleNumber} · ${a.driverName}` }))}
              placeholder={availableAmbulances.length === 0 ? "No ambulances available" : "Assign an ambulance…"}
            />
          )
        )}

        <Text style={styles.timestampText}>Requested {new Date(dispatch.createdAt).toLocaleString()}</Text>

        <View style={styles.dispatchActionsRow}>
          {!isTerminal && next && (
            <Button size="sm" isLoading={isUpdating} onPress={() => advance(next.status)}>
              {next.label}
            </Button>
          )}
          {!isTerminal && (
            <Button size="sm" variant="ghost" isLoading={isUpdating} onPress={() => advance("CANCELLED")}>
              Cancel
            </Button>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

export function AmbulanceFleetScreen({ navigation }: Props) {
  const [ambulances, setAmbulances] = useState<Ambulance[] | null>(null);
  const [dispatches, setDispatches] = useState<AmbulanceRequestItem[] | null>(null);

  useEffect(() => {
    ambulancesApi.list().then(setAmbulances).catch(() => setAmbulances([]));
    ambulanceRequestsApi.list().then(setDispatches).catch(() => setDispatches([]));
  }, []);

  const upsertAmbulance = (ambulance: Ambulance) =>
    setAmbulances((prev) => {
      if (!prev) return [ambulance];
      const exists = prev.some((a) => a.id === ambulance.id);
      return exists ? prev.map((a) => (a.id === ambulance.id ? ambulance : a)) : [ambulance, ...prev];
    });

  const upsertDispatch = (dispatch: AmbulanceRequestItem) =>
    setDispatches((prev) => (prev ? prev.map((d) => (d.id === dispatch.id ? dispatch : d)) : prev));

  const availableAmbulances = (ambulances ?? []).filter((a) => a.status === "AVAILABLE");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <RegisterAmbulanceForm onCreated={upsertAmbulance} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your fleet</Text>
        <View style={styles.list}>
          {ambulances === null ? (
            <Spinner />
          ) : ambulances.length === 0 ? (
            <Text style={styles.mutedText}>No ambulances registered yet. Add your first one above.</Text>
          ) : (
            ambulances.map((ambulance) => (
              <FleetCard key={ambulance.id} ambulance={ambulance} onUpdated={upsertAmbulance} />
            ))
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dispatch requests</Text>
        <View style={styles.list}>
          {dispatches === null ? (
            <Spinner />
          ) : dispatches.length === 0 ? (
            <Text style={styles.mutedText}>No ambulance dispatches yet.</Text>
          ) : (
            dispatches.map((dispatch) => (
              <DispatchCard
                key={dispatch.id}
                dispatch={dispatch}
                availableAmbulances={availableAmbulances}
                onUpdated={upsertDispatch}
                onPress={() => navigation.navigate("AmbulanceDetail", { id: dispatch.id })}
              />
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
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  flex1: {
    flex: 1,
  },
  formCard: {
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  coordsSetText: {
    ...typography.caption,
    color: colors.success,
    marginTop: 4,
  },
  mutedText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  list: {
    gap: spacing.sm,
  },
  fleetCard: {
    gap: spacing.xs,
  },
  fleetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  fleetVehicle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  fleetMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dispatchCard: {
    gap: spacing.sm,
  },
  dispatchHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  dispatchAddress: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  timestampText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dispatchActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
});
