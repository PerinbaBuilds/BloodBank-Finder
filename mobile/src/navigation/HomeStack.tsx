import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "./types";
import { HomeScreen } from "../screens/home/HomeScreen";
import { RequestDetailScreen } from "../screens/requests/RequestDetailScreen";
import { NewRequestScreen } from "../screens/requests/NewRequestScreen";
import { AmbulanceDetailScreen } from "../screens/ambulance/AmbulanceDetailScreen";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="HomeRoot">
      <Stack.Screen name="HomeRoot" component={HomeScreen} options={{ title: "BloodBank Finder" }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: "Request Details" }} />
      <Stack.Screen name="NewRequest" component={NewRequestScreen} options={{ title: "New Request" }} />
      <Stack.Screen name="AmbulanceDetail" component={AmbulanceDetailScreen} options={{ title: "Ambulance Dispatch" }} />
    </Stack.Navigator>
  );
}
