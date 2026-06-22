import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NotificationsStackParamList } from "./types";
import { NotificationsScreen } from "../screens/notifications/NotificationsScreen";
import { RequestDetailScreen } from "../screens/requests/RequestDetailScreen";

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export function NotificationsStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="NotificationsList">
      <Stack.Screen name="NotificationsList" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: "Request Details" }} />
    </Stack.Navigator>
  );
}
