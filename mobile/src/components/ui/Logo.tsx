import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows } from "../../lib/theme";

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size, marginBottom: size / 4 },
      ]}
    >
      <Ionicons name="water" size={size * 0.5} color={colors.background} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    ...shadows.md,
    alignSelf: "center",
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
});
