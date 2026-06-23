export const colors = {
  background: "#ffffff",
  surface: "#fafafa",
  border: "#e4e4e7",
  textPrimary: "#18181b",
  textSecondary: "#52525b",
  textMuted: "#a1a1aa",
  primary: "#dc2626",
  primaryDark: "#b91c1c",
  primarySoft: "#fef2f2",
  success: "#16a34a",
  successSoft: "#f0fdf4",
  warning: "#ea580c",
  danger: "#dc2626",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  full: 999,
};

export const typography = {
  display: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.4 },
  h1: { fontSize: 22, fontWeight: "800" as const, letterSpacing: -0.2 },
  h2: { fontSize: 18, fontWeight: "700" as const },
  subtitle: { fontSize: 14, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  bodyStrong: { fontSize: 15, fontWeight: "700" as const },
  label: { fontSize: 13, fontWeight: "600" as const },
  caption: { fontSize: 12, fontWeight: "500" as const },
};

export const shadows = {
  sm: {
    shadowColor: "#18181b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#18181b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#18181b",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};
