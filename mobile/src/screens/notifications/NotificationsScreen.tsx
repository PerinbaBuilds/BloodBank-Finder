import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSocket } from "../../context/SocketContext";
import { notificationsApi } from "../../lib/api";
import { colors, radius, spacing, typography } from "../../lib/theme";
import type { NotificationsStackParamList } from "../../navigation/types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

type Props = NativeStackScreenProps<NotificationsStackParamList, "NotificationsList">;

export function NotificationsScreen({ navigation }: Props) {
  const { notifications, unreadCount, markAllReadLocally, markReadLocally } = useSocket();

  const handleMarkAllRead = async () => {
    markAllReadLocally();
    await notificationsApi.markAllRead().catch(() => undefined);
  };

  const handlePress = async (notification: (typeof notifications)[number]) => {
    if (!notification.isRead) {
      markReadLocally(notification.id);
      await notificationsApi.markRead(notification.id).catch(() => undefined);
    }
    const ambulanceRequestId =
      notification.data && typeof notification.data.ambulanceRequestId === "string"
        ? notification.data.ambulanceRequestId
        : null;
    if (ambulanceRequestId) {
      navigation.navigate("AmbulanceDetail", { id: ambulanceRequestId });
      return;
    }
    const requestId =
      notification.data && typeof notification.data.requestId === "string" ? notification.data.requestId : null;
    if (requestId) {
      navigation.navigate("RequestDetail", { id: requestId });
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onPress={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </View>

      <View style={styles.list}>
        {notifications.length === 0 ? (
          <Text style={styles.mutedText}>You don't have any notifications yet.</Text>
        ) : (
          notifications.map((notification) => (
            <Pressable key={notification.id} onPress={() => handlePress(notification)}>
              <Card style={[styles.notificationCard, !notification.isRead && styles.unreadCard]}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {!notification.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationBody}>{notification.body}</Text>
                <Text style={styles.notificationTime}>{new Date(notification.createdAt).toLocaleString()}</Text>
              </Card>
            </Pressable>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  list: {
    gap: spacing.sm,
  },
  mutedText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  notificationCard: {
    gap: 4,
  },
  unreadCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  notificationTitle: {
    ...typography.subtitle,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  notificationBody: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  notificationTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
