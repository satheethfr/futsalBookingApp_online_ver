// lib/supabase.js
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Get Supabase configuration from environment variables
const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl ||
  "https://oextjradcmdpcnxkzsxg.supabase.co";
const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9leHRqcmFkY21kcGNueGt6c3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTAwOTIsImV4cCI6MjA3NjQ2NjA5Mn0.cow4ZzHEXd9V4nVzA9vco0EGyY-PXRvxkSwn11cS0IY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Test connection
console.log("Supabase client created with URL:", SUPABASE_URL);
