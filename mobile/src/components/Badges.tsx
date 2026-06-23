import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  AMBULANCE_REQUEST_STATUS_COLORS,
  AMBULANCE_STATUS_COLORS,
  REQUEST_STATUS_COLORS,
  RESPONSE_STATUS_COLORS,
  URGENCY_COLORS,
} from "../lib/constants";
import { colors, radius, spacing, typography } from "../lib/theme";
import type {
  AmbulanceRequestStatus,
  AmbulanceStatus,
  BloodGroupLabel,
  RequestStatus,
  ResponseStatus,
  Urgency,
} from "../lib/types";

function Badge({ color, children }: { color: string; children: string }) {
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}1a` }]}>
      <Text style={[styles.text, { color }]}>{children}</Text>
    </View>
  );
}

export function BloodGroupBadge({ group }: { group: BloodGroupLabel }) {
  return <Badge color={colors.primary}>{group}</Badge>;
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return <Badge color={URGENCY_COLORS[urgency]}>{urgency}</Badge>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge color={REQUEST_STATUS_COLORS[status]}>{status.replace("_", " ")}</Badge>;
}

export function ResponseStatusBadge({ status }: { status: ResponseStatus }) {
  return <Badge color={RESPONSE_STATUS_COLORS[status]}>{status}</Badge>;
}

export function AmbulanceStatusBadge({ status }: { status: AmbulanceStatus }) {
  return <Badge color={AMBULANCE_STATUS_COLORS[status]}>{status.replace("_", " ")}</Badge>;
}

export function AmbulanceRequestStatusBadge({ status }: { status: AmbulanceRequestStatus }) {
  return <Badge color={AMBULANCE_REQUEST_STATUS_COLORS[status]}>{status.replace("_", " ")}</Badge>;
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  text: {
    ...typography.caption,
    fontWeight: "700",
  },
});
