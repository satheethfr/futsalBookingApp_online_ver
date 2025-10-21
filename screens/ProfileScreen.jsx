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
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  RADIUS,
} from "../constants/theme";

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
    backgroundColor: COLORS.background,
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
    padding: SPACING.lg,
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
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  customerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  customerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  customerAvatarText: {
    color: COLORS.surface,
    fontSize: 32,
    fontWeight: "bold",
  },
  customerName: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  customerMobile: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  customerCity: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  editButtonText: {
    color: COLORS.surface,
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    marginHorizontal: 5,
    ...SHADOWS.light,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 5,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  bookingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingDate: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  bookingTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  bookingStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  cancelButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "600",
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  completeButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "600",
  },
  emptySectionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: SPACING.lg,
  },
});
