import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "./types";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { EditDonorProfileScreen } from "../screens/profile/EditDonorProfileScreen";
import { InventoryScreen } from "../screens/profile/InventoryScreen";
import { DonationHistoryScreen } from "../screens/profile/DonationHistoryScreen";
import { AmbulanceDetailScreen } from "../screens/ambulance/AmbulanceDetailScreen";
import { AmbulanceFleetScreen } from "../screens/ambulance/AmbulanceFleetScreen";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="ProfileRoot">
      <Stack.Screen name="ProfileRoot" component={ProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="EditDonorProfile" component={EditDonorProfileScreen} options={{ title: "Edit Profile" }} />
      <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: "Inventory" }} />
      <Stack.Screen name="AmbulanceDetail" component={AmbulanceDetailScreen} options={{ title: "Ambulance Dispatch" }} />
      <Stack.Screen name="AmbulanceFleet" component={AmbulanceFleetScreen} options={{ title: "Ambulance Fleet" }} />
      <Stack.Screen name="DonationHistory" component={DonationHistoryScreen} options={{ title: "My Donations" }} />
    </Stack.Navigator>
  );
}
