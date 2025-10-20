// App.jsx
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { AppProvider } from "./context/AppContext";
import { supabase } from "./lib/supabase";
import AuthScreen from "./screens/AuthScreen";
import BookingScreen from "./screens/BookingScreen";
import CustomersScreen from "./screens/CustomersScreen";
import ConfirmationScreen from "./screens/ConfirmationScreen";
import ProfileScreen from "./screens/ProfileScreen";
import OfflineBanner from "./components/OfflineBanner";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "BookCourt") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Customers") {
            iconName = focused ? "people" : "people-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      })}
    >
      <Tab.Screen
        name="BookCourt"
        component={BookingScreen}
        options={{ title: "Book Court" }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{ title: "Customers" }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return null; // You could add a loading screen here
  }

  if (!user) {
    return (
      <AppProvider>
        <AuthScreen onAuthSuccess={setUser} />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <OfflineBanner />
        <Stack.Navigator>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Confirmation"
            component={ConfirmationScreen}
            options={{ title: "Confirm Booking" }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: "Customer Profile" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </AppProvider>
  );
}
