import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing } from "../../lib/theme";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  hint?: string;
  searchable?: boolean;
}

export function SelectField({ label, value, onChange, options, placeholder = "Select", hint, searchable }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(
    () => (query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options),
    [options, query]
  );

  const close = () => {
    setIsOpen(false);
    setQuery("");
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable style={styles.trigger} onPress={() => setIsOpen(true)}>
        <Text style={selected ? styles.value : styles.placeholder}>{selected ? selected.label : placeholder}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {hint && <Text style={styles.hint}>{hint}</Text>}

      <Modal visible={isOpen} animationType="slide" transparent onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{label ?? placeholder}</Text>
          {searchable && (
            <TextInput
              style={styles.search}
              placeholder="Search..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
            />
          )}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.option}
                onPress={() => {
                  onChange(item.value);
                  close();
                }}
              >
                <Text style={item.value === value ? styles.optionTextActive : styles.optionText}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  trigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  placeholder: {
    fontSize: 15,
    color: colors.textMuted,
  },
  chevron: {
    color: colors.textMuted,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: "70%",
    padding: spacing.lg,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  list: {
    marginBottom: spacing.md,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  optionTextActive: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "700",
  },
});
