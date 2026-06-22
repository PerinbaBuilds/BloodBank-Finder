import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../../lib/theme";

export function Spinner() {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
});
