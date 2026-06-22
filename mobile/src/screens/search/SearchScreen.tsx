import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../../components/ui/Spinner";
import { OrgSearchScreen } from "./OrgSearchScreen";
import { FindDonorsScreen } from "./FindDonorsScreen";

export function SearchScreen() {
  const { user } = useAuth();

  if (!user) return <Spinner />;
  if (user.role === "HOSPITAL" || user.role === "BLOOD_BANK") return <FindDonorsScreen />;
  return <OrgSearchScreen />;
}
