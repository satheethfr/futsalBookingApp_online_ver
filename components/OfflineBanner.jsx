// components/OfflineBanner.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useApp } from "../context/AppContext";
import { COLORS, SPACING, TYPOGRAPHY } from "../constants/theme";

export default function OfflineBanner() {
  const { isOffline, isUsingCache, isReconnecting } = useApp();

  if (!isOffline && !isReconnecting) return null;

  return (
    <View style={[styles.banner, isOffline && styles.offline]}>
      <Text style={styles.text}>
        {isOffline
          ? "⚠️ You are offline" +
            (isUsingCache ? " - Viewing cached data" : "")
          : "🔄 Reconnecting..."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
  },
  offline: {
    backgroundColor: COLORS.accent,
  },
  text: {
    color: COLORS.surface,
    ...TYPOGRAPHY.caption,
    fontWeight: "500",
  },
});
