import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./types";
import { WelcomeScreen } from "../screens/auth/WelcomeScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterChoiceScreen } from "../screens/auth/RegisterChoiceScreen";
import { RegisterDonorScreen } from "../screens/auth/RegisterDonorScreen";
import { RegisterOrganizationScreen } from "../screens/auth/RegisterOrganizationScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ title: "BloodBank Finder" }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Login" }} />
      <Stack.Screen name="RegisterChoice" component={RegisterChoiceScreen} options={{ title: "Register" }} />
      <Stack.Screen name="RegisterDonor" component={RegisterDonorScreen} options={{ title: "Donor Registration" }} />
      <Stack.Screen
        name="RegisterOrganization"
        component={RegisterOrganizationScreen}
        options={{ title: "Organization Registration" }}
      />
    </Stack.Navigator>
  );
}
