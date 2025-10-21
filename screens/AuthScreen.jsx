// screens/AuthScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";
import { handleError } from "../lib/errorHandler";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  RADIUS,
} from "../constants/theme";

export default function AuthScreen({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Test Supabase connection on component mount
  React.useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("count")
          .limit(1);
        console.log("Supabase connection test:", { data, error });
      } catch (err) {
        console.log("Supabase connection error:", err);
      }
    };
    testConnection();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    // Demo mode - for testing without Supabase setup
    if (email === "demo@a2sportspark.com" && password === "demo123") {
      setIsLoading(true);
      setTimeout(() => {
        onAuthSuccess({ id: "demo-user", email: "demo@a2sportspark.com" });
        setIsLoading(false);
      }, 1000);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting login with:", { email, password: "***" });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), // Ensure email is trimmed and lowercase
        password,
      });

      console.log("Login response:", { data, error });

      if (error) {
        console.error("Login error details:", error);
        throw error;
      }

      console.log("Login successful:", data.user);
      onAuthSuccess(data.user);
    } catch (error) {
      console.error("Full error:", error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>A2 Sports Park</Text>
        <Text style={styles.subtitle}>Owner Login</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Demo Login: demo@a2sportspark.com / demo123
        </Text>
        <Text style={styles.footerText}>
          Or use your Supabase owner credentials
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  subtitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  form: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xxl,
    borderRadius: RADIUS.xl,
    ...SHADOWS.medium,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: "center",
  },
  footerText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
});
