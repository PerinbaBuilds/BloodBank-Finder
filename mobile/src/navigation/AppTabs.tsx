import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { AppTabParamList } from "./types";
import { useSocket } from "../context/SocketContext";
import { colors } from "../lib/theme";
import { HomeStackNavigator } from "./HomeStack";
import { RequestsStackNavigator } from "./RequestsStack";
import { SearchStackNavigator } from "./SearchStack";
import { NotificationsStackNavigator } from "./NotificationsStack";
import { ProfileStackNavigator } from "./ProfileStack";

const Tab = createBottomTabNavigator<AppTabParamList>();

const ICONS: Record<keyof AppTabParamList, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: "home", inactive: "home-outline" },
  Requests: { active: "water", inactive: "water-outline" },
  Search: { active: "search", inactive: "search-outline" },
  Notifications: { active: "notifications", inactive: "notifications-outline" },
  Profile: { active: "person", inactive: "person-outline" },
};

export function AppTabs() {
  const { unreadCount } = useSocket();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size, focused }) => {
          const icon = ICONS[route.name];
          return <Ionicons name={focused ? icon.active : icon.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Requests" component={RequestsStackNavigator} />
      <Tab.Screen name="Search" component={SearchStackNavigator} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsStackNavigator}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
