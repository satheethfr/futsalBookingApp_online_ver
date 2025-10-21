// screens/BookingScreen.jsx
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
import * as Haptics from "expo-haptics";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

export default function BookingScreen({ navigation }) {
  const {
    bookings,
    isLoading,
    isOffline,
    isUsingCache,
    isTimeSlotBooked,
    isTimeSlotCancelled,
    getBookingForTimeSlot,
    getTodayBookings,
    loadData,
    updateCustomerBookingCount,
    updateCustomerCancellationCount,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Add logout button to header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 10 }}>
          <Ionicons name="log-out-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      const timeString = `${hour.toString().padStart(2, "0")}:00`;
      slots.push(timeString);
    }
    return slots;
  }, []);

  const filteredTimeSlots = useMemo(() => {
    switch (timeFilter) {
      case "early-bird":
        return timeSlots.filter((slot) => {
          const hour = parseInt(slot.split(":")[0]);
          return hour >= 0 && hour <= 7;
        });
      case "day-shift":
        return timeSlots.filter((slot) => {
          const hour = parseInt(slot.split(":")[0]);
          return hour >= 8 && hour <= 14;
        });
      case "prime-time":
        return timeSlots.filter((slot) => {
          const hour = parseInt(slot.split(":")[0]);
          return hour >= 15 && hour <= 23;
        });
      default:
        return timeSlots;
    }
  }, [timeSlots, timeFilter]);

  // Helper function to format time slot range in 12-hour format
  const formatTimeSlotRange = (timeSlot) => {
    const hour = parseInt(timeSlot.split(":")[0]);
    const nextHour = (hour + 1) % 24;

    const formatHour = (h) => {
      if (h === 0) return "12 AM";
      if (h < 12) return `${h} AM`;
      if (h === 12) return "12 PM";
      return `${h - 12} PM`;
    };

    return `${formatHour(hour)} - ${formatHour(nextHour)}`;
  };

  const getTimeSlotStatus = (timeSlot) => {
    const isBooked = isTimeSlotBooked(timeSlot, selectedDate);
    const isCancelled = isTimeSlotCancelled(timeSlot, selectedDate);
    const isSelected = selectedTimeSlots.includes(timeSlot);
    const booking = getBookingForTimeSlot(timeSlot, selectedDate);
    const isCompleted = booking?.status === "completed";

    if (isCompleted) return { status: "completed", booking };
    if (isCancelled) return { status: "cancelled", booking };
    if (isBooked) return { status: "booked", booking };
    if (isSelected) return { status: "selected", booking: null };
    return { status: "available", booking: null };
  };

  const handleTimeSlotPress = (timeSlot) => {
    if (isOffline || isUsingCache) {
      Alert.alert(
        "Offline Mode",
        "This action requires an internet connection.",
        [{ text: "OK" }]
      );
      return;
    }

    const slotInfo = getTimeSlotStatus(timeSlot);
    const { status } = slotInfo;

    if (status === "booked" || status === "completed") {
      return; // Can't select booked or completed slots
    }

    if (status === "cancelled") {
      // Re-book cancelled slot
      setSelectedTimeSlots((prev) => [...prev, timeSlot]);
    } else if (status === "selected") {
      // Deselect slot
      setSelectedTimeSlots((prev) => prev.filter((slot) => slot !== timeSlot));
    } else {
      // Select available slot
      setSelectedTimeSlots((prev) => [...prev, timeSlot]);
    }
  };

  const handleLongPress = (timeSlot) => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isOffline || isUsingCache) {
      Alert.alert(
        "Offline Mode",
        "This action requires an internet connection.",
        [{ text: "OK" }]
      );
      return;
    }

    const slotInfo = getTimeSlotStatus(timeSlot);
    const { status, booking } = slotInfo;

    if (status === "booked" && booking) {
      Alert.alert(
        "Cancel Booking",
        `Cancel ${booking.customerName}'s booking for ${timeSlot}?\n\nThis will make the slot available for new bookings.`,
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: () => cancelTimeSlot(timeSlot),
          },
        ]
      );
    } else if (status === "completed") {
      Alert.alert(
        "Completed Booking",
        "This booking has already been completed and cannot be cancelled.",
        [{ text: "OK" }]
      );
    } else if (status === "cancelled") {
      Alert.alert(
        "Cancelled Booking",
        "This booking has already been cancelled.",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Available Slot",
        "This slot is available for booking. Tap to select it.",
        [{ text: "OK" }]
      );
    }
  };

  const cancelTimeSlot = async (timeSlot) => {
    setIsProcessing(true);
    try {
      const booking = getBookingForTimeSlot(timeSlot, selectedDate);
      if (booking) {
        const updatedCancelledSlots = [...booking.cancelledSlots, timeSlot];
        const { data, error } = await supabase
          .from("bookings")
          .update({
            cancelled_slots: updatedCancelledSlots,
            status:
              updatedCancelledSlots.length > 0 ? "cancelled" : "confirmed",
          })
          .eq("id", booking.id);

        if (error) throw error;

        // Update customer statistics - use the customer ID from the booking
        const customerId = booking.customerId;
        console.log("Booking object:", booking);
        console.log("Customer ID:", customerId);

        if (customerId) {
          await updateCustomerBookingCount(customerId, -1);
          await updateCustomerCancellationCount(customerId, 1);
        } else {
          console.warn("No customer ID found for booking:", booking);
        }

        // Force refresh of data to update UI
        await loadData();

        Alert.alert(
          "Booking Cancelled",
          `Successfully cancelled ${booking.customerName}'s booking for ${timeSlot}. The slot is now available for new bookings.`
        );
      }
    } catch (error) {
      console.error("Cancel booking error:", error);
      Alert.alert("Error", "Failed to cancel booking. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToBook = () => {
    if (isOffline || isUsingCache) {
      Alert.alert(
        "Offline Mode",
        "This action requires an internet connection.",
        [{ text: "OK" }]
      );
      return;
    }

    if (selectedTimeSlots.length === 0) {
      Alert.alert("No Selection", "Please select at least one time slot");
      return;
    }

    navigation.navigate("Confirmation", {
      selectedDate,
      selectedTimeSlots,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "booked":
        return "#D3D3D3"; // Light gray for booked slots
      case "cancelled":
        return "#FF9800";
      case "completed":
        return "#9E9E9E";
      case "selected":
        return "#2196F3";
      default:
        return "#E0E0E0";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "booked":
        return "Booked";
      case "cancelled":
        return "Cancelled";
      case "completed":
        return "Completed";
      case "selected":
        return "Selected";
      default:
        return "Available";
    }
  };

  const todayBookings = getTodayBookings();
  const todayBookedSlots = todayBookings.reduce((acc, booking) => {
    return (
      acc +
      booking.timeSlots.filter((slot) => !booking.cancelledSlots.includes(slot))
        .length
    );
  }, 0);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Today's Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Today's Bookings</Text>
          <Text style={styles.statsNumber}>{todayBookedSlots}</Text>
          <Text style={styles.statsSubtitle}>slots booked</Text>
        </View>

        {/* Date Picker */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Select Date:</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              // For now, just show today's date
              // In a real app, you'd open a date picker modal
              Alert.alert(
                "Date Selection",
                "Date picker functionality can be enhanced with a proper date picker library. Currently showing today's date.",
                [{ text: "OK" }]
              );
            }}
          >
            <Text style={styles.dateText}>{selectedDate}</Text>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Time Filter Buttons */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Time Filters</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                timeFilter === "all" && styles.activeFilterButton,
              ]}
              onPress={() => setTimeFilter("all")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  timeFilter === "all" && styles.activeFilterButtonText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                timeFilter === "early-bird" && styles.activeFilterButton,
              ]}
              onPress={() => setTimeFilter("early-bird")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  timeFilter === "early-bird" && styles.activeFilterButtonText,
                ]}
              >
                Early Bird
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                timeFilter === "day-shift" && styles.activeFilterButton,
              ]}
              onPress={() => setTimeFilter("day-shift")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  timeFilter === "day-shift" && styles.activeFilterButtonText,
                ]}
              >
                Day Shift
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                timeFilter === "prime-time" && styles.activeFilterButton,
              ]}
              onPress={() => setTimeFilter("prime-time")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  timeFilter === "prime-time" && styles.activeFilterButtonText,
                ]}
              >
                Prime Time
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Slots Grid */}
        <View style={styles.timeSlotsContainer}>
          <Text style={styles.timeSlotsTitle}>Available Time Slots</Text>
          <View style={styles.timeSlotsGrid}>
            {filteredTimeSlots.map((timeSlot) => {
              const slotInfo = getTimeSlotStatus(timeSlot);
              const { status, booking } = slotInfo;
              const isDisabled = isOffline || isUsingCache || isProcessing;
              const isBookedOrCompleted =
                status === "booked" || status === "completed";

              return (
                <TouchableOpacity
                  key={timeSlot}
                  style={[
                    styles.timeSlot,
                    { backgroundColor: getStatusColor(status) },
                    isDisabled && styles.disabledSlot,
                    isBookedOrCompleted && styles.bookedSlot,
                  ]}
                  onPress={() =>
                    !isBookedOrCompleted && handleTimeSlotPress(timeSlot)
                  }
                  onLongPress={() => handleLongPress(timeSlot)}
                  disabled={isDisabled}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      isBookedOrCompleted && styles.bookedSlotText,
                    ]}
                  >
                    {timeSlot}
                  </Text>
                  {status === "selected" && (
                    <Text style={styles.timeRangeText}>
                      {formatTimeSlotRange(timeSlot)}
                    </Text>
                  )}
                  {booking &&
                    (status === "booked" || status === "completed") && (
                      <Text style={styles.customerNameText} numberOfLines={1}>
                        {booking.customerName}
                      </Text>
                    )}
                  <Text
                    style={[
                      styles.statusText,
                      isBookedOrCompleted && styles.bookedStatusText,
                    ]}
                  >
                    {getStatusText(status)}
                  </Text>
                  {isBookedOrCompleted && (
                    <Text style={styles.longPressHint}>
                      Long press to cancel
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Proceed Button - Only show when slots are selected */}
        {selectedTimeSlots.length > 0 && (
          <TouchableOpacity
            style={[
              styles.proceedButton,
              (isOffline || isUsingCache) && styles.disabledButton,
            ]}
            onPress={handleProceedToBook}
            disabled={isOffline || isUsingCache}
          >
            <Text style={styles.proceedButtonText}>
              {isOffline || isUsingCache
                ? "Offline Mode - Actions Disabled"
                : `Proceed to Book (${selectedTimeSlots.length} slots)`}
            </Text>
          </TouchableOpacity>
        )}
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
  statsContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statsSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  dateContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  filterContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    marginVertical: 4,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  activeFilterButtonText: {
    color: "white",
  },
  timeSlotsContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  timeSlot: {
    width: "30%",
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledSlot: {
    opacity: 0.5,
  },
  bookedSlot: {
    backgroundColor: "#D3D3D3",
    opacity: 0.7,
  },
  bookedSlotText: {
    color: "#666",
    textDecorationLine: "line-through",
  },
  bookedStatusText: {
    color: "#666",
    fontSize: 10,
  },
  longPressHint: {
    fontSize: 8,
    color: "#999",
    fontStyle: "italic",
    marginTop: 2,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginBottom: 2,
  },
  timeRangeText: {
    fontSize: 9,
    color: "white",
    textAlign: "center",
    marginBottom: 2,
    opacity: 0.9,
  },
  customerNameText: {
    fontSize: 8,
    color: "white",
    textAlign: "center",
    marginBottom: 2,
    fontWeight: "500",
    opacity: 0.95,
  },
  statusText: {
    fontSize: 10,
    color: "white",
    textAlign: "center",
  },
  proceedButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  proceedButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
