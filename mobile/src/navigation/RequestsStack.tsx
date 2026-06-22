import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RequestsStackParamList } from "./types";
import { RequestsListScreen } from "../screens/requests/RequestsListScreen";
import { RequestDetailScreen } from "../screens/requests/RequestDetailScreen";
import { NewRequestScreen } from "../screens/requests/NewRequestScreen";

const Stack = createNativeStackNavigator<RequestsStackParamList>();

export function RequestsStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="RequestsList">
      <Stack.Screen name="RequestsList" component={RequestsListScreen} options={{ title: "Emergency Requests" }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: "Request Details" }} />
      <Stack.Screen name="NewRequest" component={NewRequestScreen} options={{ title: "New Request" }} />
    </Stack.Navigator>
  );
}
