import React, { useCallback, useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { ApiError, ambulanceRequestsApi, ambulancesApi } from "../../lib/api";
import { colors, spacing, typography } from "../../lib/theme";
import type { Ambulance, AmbulanceRequestItem, AmbulanceRequestStatus } from "../../lib/types";
import { AmbulanceRequestStatusBadge } from "../../components/Badges";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { SelectField } from "../../components/ui/SelectField";
import { Spinner } from "../../components/ui/Spinner";

type AmbulanceDetailParams = { AmbulanceDetail: { id: string } };

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<AmbulanceDetailParams, "AmbulanceDetail">;
}

const NEXT_STATUS: Partial<Record<AmbulanceRequestStatus, { status: AmbulanceRequestStatus; label: string }>> = {
  ASSIGNED: { status: "EN_ROUTE", label: "Mark en route" },
  EN_ROUTE: { status: "ARRIVED", label: "Mark arrived" },
  ARRIVED: { status: "COMPLETED", label: "Mark completed" },
};
const TERMINAL: AmbulanceRequestStatus[] = ["COMPLETED", "CANCELLED"];

export function AmbulanceDetailScreen({ route }: Props) {
  const { id } = route.params;
  const { organization } = useAuth();
  const { socket } = useSocket();
  const [dispatch, setDispatch] = useState<AmbulanceRequestItem | null>(null);
  const [availableAmbulances, setAvailableAmbulances] = useState<Ambulance[]>([]);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ambulanceRequestsApi.get(id);
      setDispatch(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this dispatch.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (updated: AmbulanceRequestItem) => {
      if (updated.id === id) setDispatch(updated);
    };
    socket.on("ambulance:updated", handleUpdate);
    return () => {
      socket.off("ambulance:updated", handleUpdate);
    };
  }, [socket, id]);

  useEffect(() => {
    if (!organization || dispatch?.organizationId !== organization.id) return;
    ambulancesApi
      .list()
      .then((all) => setAvailableAmbulances(all.filter((a) => a.status === "AVAILABLE")))
      .catch(() => setAvailableAmbulances([]));
  }, [organization, dispatch?.organizationId]);

  if (error) return <Text style={styles.errorPage}>{error}</Text>;
  if (!dispatch) return <Spinner />;

  const isOwningOrg = organization?.id === dispatch.organizationId;
  const isTerminal = TERMINAL.includes(dispatch.status);
  const next = NEXT_STATUS[dispatch.status];

  const assign = async (ambulanceId: string) => {
    if (!ambulanceId) return;
    setIsUpdating(true);
    try {
      const updated = await ambulanceRequestsApi.update(dispatch.id, { ambulanceId });
      setDispatch(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not assign this ambulance.");
    } finally {
      setIsUpdating(false);
    }
  };

  const advance = async (status: AmbulanceRequestStatus) => {
    setIsUpdating(true);
    try {
      const updated = await ambulanceRequestsApi.update(dispatch.id, { status });
      setDispatch(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this dispatch.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Ambulance dispatch</Text>
          <AmbulanceRequestStatusBadge status={dispatch.status} />
        </View>
        <Text style={styles.timestamps}>Requested {new Date(dispatch.createdAt).toLocaleString()}</Text>

        <View>
          <Text style={styles.bodyLabel}>Pickup</Text>
          <Text
            style={styles.addressLink}
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${dispatch.pickupLat},${dispatch.pickupLng}`)}
          >
            {dispatch.pickupAddress} · Open in Maps
          </Text>
        </View>
        <View>
          <Text style={styles.bodyLabel}>Dropoff</Text>
          <Text
            style={styles.addressLink}
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${dispatch.dropoffLat},${dispatch.dropoffLng}`)}
          >
            {dispatch.dropoffAddress} · Open in Maps
          </Text>
        </View>
        {dispatch.notes && (
          <View>
            <Text style={styles.bodyLabel}>Notes</Text>
            <Text style={styles.bodyText}>{dispatch.notes}</Text>
          </View>
        )}

        {dispatch.ambulance ? (
          <View style={styles.ambulanceInfo}>
            <Text style={styles.bodyTextStrong}>{dispatch.ambulance.vehicleNumber}</Text>
            <Text style={styles.bodyText}>{dispatch.ambulance.driverName}</Text>
            <Text
              style={styles.phoneLink}
              onPress={() => Linking.openURL(`tel:${dispatch.ambulance?.driverPhone}`)}
            >
              {dispatch.ambulance.driverPhone}
            </Text>
          </View>
        ) : (
          isOwningOrg &&
          !isTerminal && (
            <SelectField
              label="Assign an ambulance"
              value=""
              onChange={assign}
              options={availableAmbulances.map((a) => ({ value: a.id, label: `${a.vehicleNumber} · ${a.driverName}` }))}
              placeholder={availableAmbulances.length === 0 ? "No ambulances available" : "Assign an ambulance…"}
            />
          )
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {isOwningOrg && !isTerminal && (
          <View style={styles.actionsRow}>
            {next && (
              <Button size="sm" isLoading={isUpdating} onPress={() => advance(next.status)}>
                {next.label}
              </Button>
            )}
            <Button size="sm" variant="ghost" isLoading={isUpdating} onPress={() => advance("CANCELLED")}>
              Cancel dispatch
            </Button>
          </View>
        )}
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
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  errorPage: {
    flex: 1,
    padding: spacing.lg,
    ...typography.caption,
    color: colors.danger,
  },
  headerCard: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  timestamps: {
    ...typography.caption,
    color: colors.textMuted,
  },
  bodyLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  bodyText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  bodyTextStrong: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  addressLink: {
    ...typography.body,
    color: colors.primary,
    marginTop: 2,
  },
  ambulanceInfo: {
    gap: 2,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
  },
  phoneLink: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
});
