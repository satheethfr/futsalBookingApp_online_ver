// screens/ProfileScreen.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";

export default function ProfileScreen({ route, navigation }) {
  const { customerId } = route.params;
  const {
    customers,
    isOffline,
    isUsingCache,
    cancelBooking,
    completeBooking,
    getCurrentBookings,
    getPastBookings,
    getCancelledBookings,
  } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);

  const customer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );

  const currentBookings = useMemo(
    () => (customer ? getCurrentBookings(customer.id) : []),
    [customer, getCurrentBookings]
  );

  const pastBookings = useMemo(
    () => (customer ? getPastBookings(customer.id) : []),
    [customer, getPastBookings]
  );

  const cancelledBookings = useMemo(
    () => (customer ? getCancelledBookings(customer.id) : []),
    [customer, getCancelledBookings]
  );

  const handleCancelBooking = async (bookingId, timeSlots) => {
    if (isOffline || isUsingCache) {
      Alert.alert(
        "Offline Mode",
        "This action requires an internet connection.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            setIsProcessing(true);
            try {
              await cancelBooking(bookingId, timeSlots);
            } catch (error) {
              Alert.alert("Error", "Failed to cancel booking");
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteBooking = async (bookingId) => {
    if (isOffline || isUsingCache) {
      Alert.alert(
        "Offline Mode",
        "This action requires an internet connection.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert("Complete Booking", "Mark this booking as completed?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          setIsProcessing(true);
          try {
            await completeBooking(bookingId);
          } catch (error) {
            Alert.alert("Error", "Failed to complete booking");
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "#4CAF50";
      case "cancelled":
        return "#FF9800";
      case "completed":
        return "#9E9E9E";
      default:
        return "#666";
    }
  };

  if (!customer) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading customer...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Customer Info Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>
              {customer.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerMobile}>{customer.mobile}</Text>
          <Text style={styles.customerCity}>{customer.city}</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Details</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{customer.totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{customer.totalCancellations}</Text>
            <Text style={styles.statLabel}>Total Cancellations</Text>
          </View>
        </View>

        {/* Current Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Bookings</Text>
          {currentBookings.length > 0 ? (
            currentBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingItem}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingDate}>
                    {formatDate(booking.date)}
                  </Text>
                  <Text style={styles.bookingTime}>
                    {booking.timeSlots.join(", ")}
                  </Text>
                  <Text
                    style={[
                      styles.bookingStatus,
                      { color: getStatusColor(booking.status) },
                    ]}
                  >
                    {booking.status.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() =>
                    handleCancelBooking(booking.id, booking.timeSlots)
                  }
                  disabled={isOffline || isUsingCache || isProcessing}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptySectionText}>No current bookings</Text>
          )}
        </View>

        {/* Past Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Bookings</Text>
          {pastBookings.length > 0 ? (
            pastBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingItem}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingDate}>
                    {formatDate(booking.date)}
                  </Text>
                  <Text style={styles.bookingTime}>
                    {booking.timeSlots.join(", ")}
                  </Text>
                  <Text
                    style={[
                      styles.bookingStatus,
                      { color: getStatusColor(booking.status) },
                    ]}
                  >
                    {booking.status.toUpperCase()}
                  </Text>
                </View>
                {booking.status === "confirmed" && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleCompleteBooking(booking.id)}
                    disabled={isOffline || isUsingCache || isProcessing}
                  >
                    <Text style={styles.completeButtonText}>Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptySectionText}>No past bookings</Text>
          )}
        </View>

        {/* Cancelled Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancelled Bookings</Text>
          {cancelledBookings.length > 0 ? (
            cancelledBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingItem}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingDate}>
                    {formatDate(booking.date)}
                  </Text>
                  <Text style={styles.bookingTime}>
                    {booking.timeSlots.join(", ")}
                  </Text>
                  <Text
                    style={[
                      styles.bookingStatus,
                      { color: getStatusColor(booking.status) },
                    ]}
                  >
                    {booking.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptySectionText}>No cancelled bookings</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  customerCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  customerAvatarText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
  },
  customerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  customerMobile: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  customerCity: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  bookingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  bookingTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  bookingStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  completeButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  completeButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  emptySectionText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
});
