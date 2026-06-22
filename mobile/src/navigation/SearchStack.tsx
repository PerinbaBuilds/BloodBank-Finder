import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { SearchStackParamList } from "./types";
import { SearchScreen } from "../screens/search/SearchScreen";

const Stack = createNativeStackNavigator<SearchStackParamList>();

export function SearchStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="SearchRoot">
      <Stack.Screen name="SearchRoot" component={SearchScreen} options={{ title: "Search" }} />
    </Stack.Navigator>
  );
}
