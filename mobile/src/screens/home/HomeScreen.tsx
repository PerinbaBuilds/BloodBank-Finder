import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import type { HomeStackParamList } from "../../navigation/types";
import { Spinner } from "../../components/ui/Spinner";
import { DonorHomeScreen } from "./DonorHomeScreen";
import { OrganizationHomeScreen } from "./OrganizationHomeScreen";
import { AdminHomeScreen } from "./AdminHomeScreen";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeRoot">;

export function HomeScreen(props: Props) {
  const { user } = useAuth();

  if (!user) return <Spinner />;
  if (user.role === "DONOR") return <DonorHomeScreen {...props} />;
  if (user.role === "HOSPITAL" || user.role === "BLOOD_BANK") return <OrganizationHomeScreen {...props} />;
  return <AdminHomeScreen />;
}
