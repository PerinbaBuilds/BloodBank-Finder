import React, { useCallback, useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { ApiError, requestsApi } from "../../lib/api";
import { colors, spacing, typography } from "../../lib/theme";
import type { RequestDetail, RequestResponseItem, ResponseStatus } from "../../lib/types";
import { BloodGroupBadge, RequestStatusBadge, ResponseStatusBadge, UrgencyBadge } from "../../components/Badges";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Spinner } from "../../components/ui/Spinner";

type RequestDetailParams = { RequestDetail: { id: string } };

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<RequestDetailParams, "RequestDetail">;
}

function ResponseRow({
  response,
  isOwningOrg,
  isMine,
  onUpdate,
}: {
  response: RequestResponseItem;
  isOwningOrg: boolean;
  isMine: boolean;
  onUpdate: (responseId: string, status: ResponseStatus) => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const act = async (status: ResponseStatus) => {
    setIsUpdating(true);
    try {
      await onUpdate(response.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card style={styles.responseCard}>
      <View style={styles.flex1}>
        <View style={styles.responseHeader}>
          <Text style={styles.responseName}>{response.donor?.fullName ?? "Donor"}</Text>
          {response.donor && <BloodGroupBadge group={response.donor.bloodGroup} />}
        </View>
        <Text style={styles.responseMeta}>
          ~{response.distanceKm} km away · Responded {new Date(response.respondedAt).toLocaleString()}
        </Text>
        {response.donor?.phone && (
          <Text style={styles.phoneLink} onPress={() => Linking.openURL(`tel:${response.donor?.phone}`)}>
            {response.donor.phone}
          </Text>
        )}
      </View>
      <View style={styles.responseActions}>
        <ResponseStatusBadge status={response.status} />
        {isOwningOrg && response.status === "OFFERED" && (
          <>
            <Button size="sm" isLoading={isUpdating} onPress={() => act("CONFIRMED")}>
              Confirm
            </Button>
            <Button size="sm" variant="outline" isLoading={isUpdating} onPress={() => act("DECLINED")}>
              Decline
            </Button>
          </>
        )}
        {isOwningOrg && response.status === "CONFIRMED" && (
          <Button size="sm" isLoading={isUpdating} onPress={() => act("COMPLETED")}>
            Mark completed
          </Button>
        )}
        {isMine && (response.status === "OFFERED" || response.status === "CONFIRMED") && (
          <Button size="sm" variant="ghost" isLoading={isUpdating} onPress={() => act("CANCELLED")}>
            Cancel
          </Button>
        )}
      </View>
    </Card>
  );
}

export function RequestDetailScreen({ route }: Props) {
  const { id } = route.params;
  const { user, organization } = useAuth();
  const { socket } = useSocket();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [isUpdatingRequest, setIsUpdatingRequest] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await requestsApi.get(id);
      setRequest(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this request.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on("request:updated", refresh);
    socket.on("response:new", refresh);
    socket.on("response:updated", refresh);
    return () => {
      socket.off("request:updated", refresh);
      socket.off("response:new", refresh);
      socket.off("response:updated", refresh);
    };
  }, [socket, load]);

  if (error) return <Text style={styles.errorPage}>{error}</Text>;
  if (!request) return <Spinner />;

  const isOwningOrg = organization?.id === request.organizationId;
  const myResponse = request.responses.find((r) => r.donorUserId === user?.id);
  const canRespond =
    user?.role === "DONOR" && !myResponse && (request.status === "OPEN" || request.status === "PARTIALLY_FULFILLED");
  const canManageRequest = isOwningOrg && (request.status === "OPEN" || request.status === "PARTIALLY_FULFILLED");

  const handleRespond = async () => {
    setActionError("");
    setIsResponding(true);
    try {
      await requestsApi.respond(request.id);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not submit your offer.");
    } finally {
      setIsResponding(false);
    }
  };

  const handleUpdateResponse = async (responseId: string, status: ResponseStatus) => {
    setActionError("");
    try {
      await requestsApi.updateResponse(request.id, responseId, status);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not update this response.");
    }
  };

  const handleUpdateRequestStatus = async (status: "CANCELLED" | "FULFILLED") => {
    setActionError("");
    setIsUpdatingRequest(true);
    try {
      await requestsApi.update(request.id, { status });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not update this request.");
    } finally {
      setIsUpdatingRequest(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.flex1}>
            <Text style={styles.title}>
              {request.organization?.name ?? "Organization"} needs {request.bloodGroup} blood
            </Text>
            <Text
              style={styles.address}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${request.lat},${request.lng}`)}
            >
              {request.address} · Open in Maps
            </Text>
          </View>
          <BloodGroupBadge group={request.bloodGroup} />
        </View>

        <View style={styles.badgeRow}>
          <UrgencyBadge urgency={request.urgency} />
          <RequestStatusBadge status={request.status} />
          <Text style={styles.unitsText}>
            {request.unitsFulfilled}/{request.unitsNeeded} units fulfilled
          </Text>
        </View>

        {request.patientInfo && (
          <Text style={styles.bodyText}>
            <Text style={styles.bodyLabel}>Patient info: </Text>
            {request.patientInfo}
          </Text>
        )}
        {request.notes && (
          <Text style={styles.bodyText}>
            <Text style={styles.bodyLabel}>Notes: </Text>
            {request.notes}
          </Text>
        )}

        <Text style={styles.timestamps}>
          Posted {new Date(request.createdAt).toLocaleString()} · Expires {new Date(request.expiresAt).toLocaleString()}
        </Text>

        {actionError && <Text style={styles.errorText}>{actionError}</Text>}

        <View style={styles.actionsRow}>
          {canRespond && (
            <Button isLoading={isResponding} onPress={handleRespond}>
              Offer to donate
            </Button>
          )}
          {myResponse && <Text style={styles.mutedText}>Your offer status: {myResponse.status}</Text>}
          {canManageRequest && (
            <>
              <Button variant="outline" isLoading={isUpdatingRequest} onPress={() => handleUpdateRequestStatus("FULFILLED")}>
                Mark fulfilled
              </Button>
              <Button variant="ghost" isLoading={isUpdatingRequest} onPress={() => handleUpdateRequestStatus("CANCELLED")}>
                Cancel request
              </Button>
            </>
          )}
        </View>
      </Card>

      {isOwningOrg && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Donor responses ({request.responses.length})</Text>
          <View style={styles.list}>
            {request.responses.length === 0 ? (
              <Text style={styles.mutedText}>No donors have responded yet.</Text>
            ) : (
              request.responses.map((response) => (
                <ResponseRow
                  key={response.id}
                  response={response}
                  isOwningOrg={isOwningOrg}
                  isMine={response.donorUserId === user?.id}
                  onUpdate={handleUpdateResponse}
                />
              ))
            )}
          </View>
        </View>
      )}

      {myResponse && !isOwningOrg && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your offer</Text>
          <View style={styles.list}>
            <ResponseRow response={myResponse} isOwningOrg={false} isMine={true} onUpdate={handleUpdateResponse} />
          </View>
        </View>
      )}
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
  address: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  unitsText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bodyText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  bodyLabel: {
    fontWeight: "700",
  },
  timestamps: {
    ...typography.caption,
    color: colors.textMuted,
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
  mutedText: {
    ...typography.caption,
    color: colors.textSecondary,
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
  responseCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  responseName: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  responseMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  phoneLink: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
  },
  responseActions: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
});
