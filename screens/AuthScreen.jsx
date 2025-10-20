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
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
  },
  form: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 30,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    textAlign: "center",
    fontSize: 14,
  },
});
