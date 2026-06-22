import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { colors, radius, spacing } from "../../lib/theme";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const SIZE_STYLES: Record<Size, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 6, paddingHorizontal: spacing.md, fontSize: 13 },
  md: { paddingVertical: 10, paddingHorizontal: spacing.lg, fontSize: 15 },
  lg: { paddingVertical: 14, paddingHorizontal: spacing.xl, fontSize: 16 },
};

export function Button({ children, onPress, variant = "primary", size = "md", isLoading, disabled, style }: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const sizeStyle = SIZE_STYLES[size];

  const variantStyle: ViewStyle = {
    primary: { backgroundColor: colors.primary, borderColor: colors.primary },
    secondary: { backgroundColor: colors.surface, borderColor: colors.border },
    outline: { backgroundColor: "transparent", borderColor: colors.primary },
    ghost: { backgroundColor: "transparent", borderColor: "transparent" },
  }[variant];

  const textColor = {
    primary: "#ffffff",
    secondary: colors.textPrimary,
    outline: colors.primary,
    ghost: colors.textSecondary,
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        variantStyle,
        { paddingVertical: sizeStyle.paddingVertical, paddingHorizontal: sizeStyle.paddingHorizontal },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor, fontSize: sizeStyle.fontSize }]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
