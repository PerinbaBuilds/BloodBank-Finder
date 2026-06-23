import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { ApiError, requestsApi } from "../../lib/api";
import { BLOOD_GROUPS } from "../../lib/constants";
import { colors, spacing, typography } from "../../lib/theme";
import type { RequestsStackParamList } from "../../navigation/types";
import type { BloodGroupLabel, EmergencyRequest, RequestStatus } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { SelectField } from "../../components/ui/SelectField";
import { Card } from "../../components/ui/Card";
import { Spinner } from "../../components/ui/Spinner";
import { RequestCard } from "../../components/RequestCard";

const STATUS_OPTIONS: RequestStatus[] = ["OPEN", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED", "EXPIRED"];

type Props = NativeStackScreenProps<RequestsStackParamList, "RequestsList">;

export function RequestsListScreen({ navigation }: Props) {
  const { user, donor } = useAuth();
  const { socket } = useSocket();
  const isOrg = user?.role === "HOSPITAL" || user?.role === "BLOOD_BANK";

  const [status, setStatus] = useState<RequestStatus | "">("OPEN");
  const [bloodGroup, setBloodGroup] = useState<BloodGroupLabel | "">("");
  const [mineOnly, setMineOnly] = useState(false);
  const [requests, setRequests] = useState<EmergencyRequest[] | null>(null);
  const [error, setError] = useState("");

  const fetchRequests = useCallback(async () => {
    setError("");
    try {
      const data = await requestsApi.list({
        status: status || undefined,
        bloodGroup: bloodGroup || undefined,
        mine: isOrg && mineOnly ? true : undefined,
        lat: !isOrg ? donor?.lat : undefined,
        lng: !isOrg ? donor?.lng : undefined,
      });
      setRequests(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load requests.");
      setRequests([]);
    }
  }, [status, bloodGroup, mineOnly, isOrg, donor]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!socket) return;
    const onChange = () => fetchRequests();
    socket.on("request:new", onChange);
    socket.on("request:updated", onChange);
    return () => {
      socket.off("request:new", onChange);
      socket.off("request:updated", onChange);
    };
  }, [socket, fetchRequests]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.flex1}>
          <Text style={styles.title}>Emergency requests</Text>
          <Text style={styles.subtitle}>
            {isOrg ? "Browse and manage emergency blood requests." : "Open requests you may be able to help with."}
          </Text>
        </View>
        {isOrg && <Button onPress={() => navigation.navigate("NewRequest")}>New request</Button>}
      </View>

      <Card style={styles.filters}>
        <SelectField
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as RequestStatus | "")}
          placeholder="Any"
          options={[{ label: "Any", value: "" }, ...STATUS_OPTIONS.map((s) => ({ label: s.replace("_", " "), value: s }))]}
        />
        <SelectField
          label="Blood group"
          value={bloodGroup}
          onChange={(v) => setBloodGroup(v as BloodGroupLabel | "")}
          placeholder="Any"
          options={[{ label: "Any", value: "" }, ...BLOOD_GROUPS.map((g) => ({ label: g, value: g }))]}
        />
        {isOrg && (
          <Button variant={mineOnly ? "primary" : "outline"} size="sm" onPress={() => setMineOnly((v) => !v)}>
            {mineOnly ? "Showing only my organization's requests" : "Show only my organization's requests"}
          </Button>
        )}
      </Card>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.list}>
        {requests === null ? (
          <Spinner />
        ) : requests.length === 0 ? (
          <Text style={styles.mutedText}>No requests match your filters.</Text>
        ) : (
          requests.map((request) => (
            <RequestCard key={request.id} request={request} onPress={() => navigation.navigate("RequestDetail", { id: request.id })} />
          ))
        )}
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
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  flex1: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filters: {
    gap: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
  list: {
    gap: spacing.sm,
  },
  mutedText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
