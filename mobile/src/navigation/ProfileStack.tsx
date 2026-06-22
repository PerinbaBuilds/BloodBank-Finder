import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "./types";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { EditDonorProfileScreen } from "../screens/profile/EditDonorProfileScreen";
import { InventoryScreen } from "../screens/profile/InventoryScreen";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="ProfileRoot">
      <Stack.Screen name="ProfileRoot" component={ProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="EditDonorProfile" component={EditDonorProfileScreen} options={{ title: "Edit Profile" }} />
      <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: "Inventory" }} />
    </Stack.Navigator>
  );
}
