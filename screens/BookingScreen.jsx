// screens/BookingScreen.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  RADIUS,
} from "../constants/theme";

const { width: screenWidth } = Dimensions.get("window");

export default function BookingScreen({ navigation }) {
  const {
    bookings,
    customers,
    isLoading,
    isOffline,
    isUsingCache,
    isTimeSlotBooked,
    isTimeSlotCancelled,
    getBookingForTimeSlot,
    getTodayBookings,
    getTodayBookingsWithDetails,
    cancelBooking,
    loadData,
    updateCustomerBookingCount,
    updateCustomerCancellationCount,
  } = useApp();

  // Helper function to get today's date in local format
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");

  // Panel state
  const [isTodayPanelVisible, setIsTodayPanelVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const scrollRef = useRef(null);
  const panRef = useRef(null);

  // Swipe gesture values
  const translateX = useSharedValue(0);
  const panelWidth = screenWidth * 0.8;

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

  // Load data when component mounts to ensure fresh state
  useEffect(() => {
    loadData();
  }, []); // Empty dependency array means this only runs once on mount

  // Clear selected time slots when returning to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Clear selected time slots when screen comes into focus
      setSelectedTimeSlots([]);
      console.log("BookingScreen focused - cleared selected time slots");
    });

    return unsubscribe;
  }, [navigation]);

  // Monitor bookings changes for debugging
  useEffect(() => {
    console.log("Bookings updated:", bookings.length);
    const completedBookings = bookings.filter(
      (booking) => booking.status === "completed"
    );
    console.log("Completed bookings:", completedBookings.length);
  }, [bookings]);

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

  // Calendar helper functions
  const getCalendarDays = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    const selected = new Date(selectedDate);
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const isDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    return dateToCheck < today;
  };

  const handleDateSelect = (date) => {
    // Fix timezone issue by using local date methods
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;
    setSelectedDate(dateString);
    setSelectedTimeSlots([]); // Clear selections when date changes
  };

  const getTimeSlotStatus = (timeSlot) => {
    const isBooked = isTimeSlotBooked(timeSlot, selectedDate);
    const isCancelled = isTimeSlotCancelled(timeSlot, selectedDate);
    const isSelected = selectedTimeSlots.includes(timeSlot);
    const booking = getBookingForTimeSlot(timeSlot, selectedDate);
    const isCompleted = booking?.status === "completed";

    // Debug log for completed slots
    if (isCompleted) {
      console.log(
        `Time slot ${timeSlot} is completed for booking ${booking?.id}`
      );
    }

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
              updatedCancelledSlots.length === booking.timeSlots.length
                ? "cancelled"
                : "confirmed",
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

  // Gesture handler for swipe
  const gestureHandler = (event) => {
    "worklet";
    const { translationX, state } = event.nativeEvent;

    if (state === State.BEGAN) {
      // Gesture started
    } else if (state === State.ACTIVE) {
      // Handle left-to-right swipe (positive translationX)
      if (translationX > 0) {
        translateX.value = Math.min(translationX, panelWidth);
      }
    } else if (state === State.END) {
      if (translationX > panelWidth * 0.3) {
        // Show panel
        translateX.value = withSpring(panelWidth);
        runOnJS(setIsTodayPanelVisible)(true);
      } else {
        // Hide panel
        translateX.value = withSpring(0);
        runOnJS(setIsTodayPanelVisible)(false);
      }
    }
  };

  // Animated styles
  const animatedMainStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -translateX.value }],
    };
  });

  // Simple panel toggle function
  const toggleTodayPanel = () => {
    setIsTodayPanelVisible(!isTodayPanelVisible);
  };

  // Enhanced main content tap handler
  const handleMainContentTap = () => {
    if (isTodayPanelVisible) {
      // Close the side panel when main content is tapped
      setIsTodayPanelVisible(false);
      translateX.value = withSpring(0);
      console.log("Main content tapped - closing side panel");
    }
  };

  // Enhanced cancel booking handler for individual time slots
  const handleCancelBooking = async (bookingId, timeSlots) => {
    const slotCount = timeSlots.length;
    const slotText = slotCount === 1 ? "this time slot" : "these time slots";

    Alert.alert(
      "Cancel Booking",
      `Are you sure you want to cancel ${slotText}?\n\nThis will make the slot(s) available for new bookings.`,
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            // Pass the specific time slots as cancelled slots
            const cancelledSlots = timeSlots || [];
            const result = await cancelBooking(bookingId, cancelledSlots);
            if (result.success) {
              console.log("Time slot(s) cancelled successfully");
              // The real-time subscription will update the side panel
            }
          },
        },
      ]
    );
  };

  // Complete booking handler for individual time slots
  const handleCompleteBooking = async (bookingId, timeSlots) => {
    const slotCount = timeSlots.length;
    const slotText = slotCount === 1 ? "this time slot" : "these time slots";

    Alert.alert(
      "Complete Booking",
      `Mark ${slotText} as completed?\n\nThis will lock the slot and mark it as finished.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Complete",
          style: "default",
          onPress: async () => {
            try {
              // Update booking status to "completed" in Supabase
              const { data, error } = await supabase
                .from("bookings")
                .update({ status: "completed" })
                .eq("id", bookingId);

              if (error) throw error;

              console.log("Booking completed successfully");

              // Force immediate refresh of data to update UI
              await loadData();

              // Trigger component re-render
              setRefreshTrigger((prev) => prev + 1);

              // Additional delay to ensure database consistency
              setTimeout(async () => {
                await loadData();
                setRefreshTrigger((prev) => prev + 1);
                console.log("Secondary refresh completed");
              }, 500);
            } catch (error) {
              console.error("Complete booking error:", error);
              Alert.alert(
                "Error",
                "Failed to complete booking. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return COLORS.surface; // White
      case "selected":
        return COLORS.primary; // Green
      case "booked":
        return COLORS.background; // Light gray
      case "completed":
        return "#E8F5E8"; // Light green background for completed
      case "cancelled":
        return COLORS.background; // Light gray
      default:
        return COLORS.surface; // White
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

  // Removed complex TodayBookingsPanel - using simple inline content

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
      <PanGestureHandler
        ref={panRef}
        onHandlerStateChange={gestureHandler}
        activeOffsetX={10}
        failOffsetY={[-10, 10]}
        simultaneousHandlers={scrollRef}
      >
        <Animated.View style={[styles.mainContent, animatedMainStyle]}>
          {isTodayPanelVisible ? (
            <TouchableOpacity
              style={styles.mainContentTouchable}
              onPress={handleMainContentTap}
              activeOpacity={1} // Prevent visual feedback since it's just for closing panel
            >
              <ScrollView
                ref={scrollRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
                simultaneousHandlers={panRef}
              >
                {/* A2 Sports Park Header */}
                <View style={styles.headerSection}>
                  <View style={styles.headerGradient}>
                    <Text style={styles.headerTitle}>A2 Sports Park</Text>
                    <Text style={styles.headerSubtitle}>
                      Premium Futsal Court Booking
                    </Text>
                    <View style={styles.headerAccent} />
                    <View style={styles.headerAccent2} />
                  </View>
                </View>

                {/* Compact Calendar Display */}
                <View style={styles.calendarSection}>
                  <Text style={styles.calendarSectionTitle}>Select Date</Text>
                  <View style={styles.fullCalendar}>
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity
                        onPress={() => {
                          const newMonth = new Date(selectedDate);
                          newMonth.setMonth(newMonth.getMonth() - 1);
                          const year = newMonth.getFullYear();
                          const month = String(
                            newMonth.getMonth() + 1
                          ).padStart(2, "0");
                          const day = String(newMonth.getDate()).padStart(
                            2,
                            "0"
                          );
                          setSelectedDate(`${year}-${month}-${day}`);
                        }}
                        style={styles.calendarNavButton}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={18}
                          color={COLORS.textSecondary}
                        />
                      </TouchableOpacity>

                      <Text style={styles.calendarMonthYear}>
                        {new Date(selectedDate).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          const newMonth = new Date(selectedDate);
                          newMonth.setMonth(newMonth.getMonth() + 1);
                          const year = newMonth.getFullYear();
                          const month = String(
                            newMonth.getMonth() + 1
                          ).padStart(2, "0");
                          const day = String(newMonth.getDate()).padStart(
                            2,
                            "0"
                          );
                          setSelectedDate(`${year}-${month}-${day}`);
                        }}
                        style={styles.calendarNavButton}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={COLORS.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Day Headers */}
                    <View style={styles.dayHeaders}>
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <Text key={day} style={styles.dayHeader}>
                            {day}
                          </Text>
                        )
                      )}
                    </View>

                    {/* Fixed Calendar Grid */}
                    <View style={styles.fixedCalendarGrid}>
                      {getCalendarDays(selectedDate).map((day, index) => (
                        <View key={index} style={styles.calendarDayContainer}>
                          <TouchableOpacity
                            style={[
                              styles.fixedCalendarDay,
                              day && isToday(day) && styles.todayDay,
                              day && isSelected(day) && styles.selectedDay,
                              day && isDisabled(day) && styles.disabledDay,
                            ]}
                            onPress={() =>
                              day && !isDisabled(day) && handleDateSelect(day)
                            }
                            disabled={!day || isDisabled(day)}
                          >
                            <Text
                              style={[
                                styles.fixedCalendarDayText,
                                day && isToday(day) && styles.todayText,
                                day && isSelected(day) && styles.selectedText,
                                day && isDisabled(day) && styles.disabledText,
                              ]}
                            >
                              {day ? day.getDate() : ""}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
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
                        timeFilter === "early-bird" &&
                          styles.activeFilterButton,
                      ]}
                      onPress={() => setTimeFilter("early-bird")}
                    >
                      <Text
                        style={[
                          styles.filterButtonText,
                          timeFilter === "early-bird" &&
                            styles.activeFilterButtonText,
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
                          timeFilter === "day-shift" &&
                            styles.activeFilterButtonText,
                        ]}
                      >
                        Day Shift
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        timeFilter === "prime-time" &&
                          styles.activeFilterButton,
                      ]}
                      onPress={() => setTimeFilter("prime-time")}
                    >
                      <Text
                        style={[
                          styles.filterButtonText,
                          timeFilter === "prime-time" &&
                            styles.activeFilterButtonText,
                        ]}
                      >
                        Prime Time
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Simple Panel Toggle Button */}
                <TouchableOpacity
                  style={styles.simpleToggleButton}
                  onPress={() => {
                    console.log("Toggle button pressed!");
                    setIsTodayPanelVisible(!isTodayPanelVisible);
                  }}
                >
                  <Text style={styles.simpleToggleButtonText}>
                    {isTodayPanelVisible ? "Hide" : "Show"} Today's Bookings
                  </Text>
                </TouchableOpacity>

                {/* Time Slots Grid */}
                <Text style={styles.timeSlotsTitle}>Available Time Slots</Text>
                <View style={styles.timeSlotsGrid}>
                  {filteredTimeSlots.map((timeSlot) => {
                    const slotInfo = getTimeSlotStatus(timeSlot);
                    const { status, booking } = slotInfo;
                    const isDisabled =
                      isOffline || isUsingCache || isProcessing;
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
                            status === "selected" && styles.selectedSlotText,
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
                            <Text
                              style={styles.customerNameText}
                              numberOfLines={1}
                            >
                              {booking.customerName}
                            </Text>
                          )}
                        {/* Removed status text for cleaner look */}
                        {isBookedOrCompleted && (
                          <Text style={styles.longPressHint}>
                            Long press to cancel
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
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
            </TouchableOpacity>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              simultaneousHandlers={panRef}
            >
              {/* A2 Sports Park Header */}
              <View style={styles.headerSection}>
                <View style={styles.headerGradient}>
                  <Text style={styles.headerTitle}>A2 Sports Park</Text>
                  <Text style={styles.headerSubtitle}>
                    Premium Futsal Court Booking
                  </Text>
                  <View style={styles.headerAccent} />
                  <View style={styles.headerAccent2} />
                </View>
              </View>

              {/* Compact Calendar Display */}
              <View style={styles.calendarSection}>
                <Text style={styles.calendarSectionTitle}>Select Date</Text>
                <View style={styles.fullCalendar}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity
                      onPress={() => {
                        const newMonth = new Date(selectedDate);
                        newMonth.setMonth(newMonth.getMonth() - 1);
                        const year = newMonth.getFullYear();
                        const month = String(newMonth.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(newMonth.getDate()).padStart(2, "0");
                        setSelectedDate(`${year}-${month}-${day}`);
                      }}
                      style={styles.calendarNavButton}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={18}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>

                    <Text style={styles.calendarMonthYear}>
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        const newMonth = new Date(selectedDate);
                        newMonth.setMonth(newMonth.getMonth() + 1);
                        const year = newMonth.getFullYear();
                        const month = String(newMonth.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(newMonth.getDate()).padStart(2, "0");
                        setSelectedDate(`${year}-${month}-${day}`);
                      }}
                      style={styles.calendarNavButton}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Day Headers */}
                  <View style={styles.dayHeaders}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <Text key={day} style={styles.dayHeader}>
                          {day}
                        </Text>
                      )
                    )}
                  </View>

                  {/* Fixed Calendar Grid */}
                  <View style={styles.fixedCalendarGrid}>
                    {getCalendarDays(selectedDate).map((day, index) => (
                      <View key={index} style={styles.calendarDayContainer}>
                        <TouchableOpacity
                          style={[
                            styles.fixedCalendarDay,
                            day && isToday(day) && styles.todayDay,
                            day && isSelected(day) && styles.selectedDay,
                            day && isDisabled(day) && styles.disabledDay,
                          ]}
                          onPress={() =>
                            day && !isDisabled(day) && handleDateSelect(day)
                          }
                          disabled={!day || isDisabled(day)}
                        >
                          <Text
                            style={[
                              styles.fixedCalendarDayText,
                              day && isToday(day) && styles.todayText,
                              day && isSelected(day) && styles.selectedText,
                              day && isDisabled(day) && styles.disabledText,
                            ]}
                          >
                            {day ? day.getDate() : ""}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
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
                        timeFilter === "early-bird" &&
                          styles.activeFilterButtonText,
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
                        timeFilter === "day-shift" &&
                          styles.activeFilterButtonText,
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
                        timeFilter === "prime-time" &&
                          styles.activeFilterButtonText,
                      ]}
                    >
                      Prime Time
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Simple Panel Toggle Button */}
              <TouchableOpacity
                style={styles.simpleToggleButton}
                onPress={() => {
                  console.log("Toggle button pressed!");
                  setIsTodayPanelVisible(!isTodayPanelVisible);
                }}
              >
                <Text style={styles.simpleToggleButtonText}>
                  {isTodayPanelVisible ? "Hide" : "Show"} Today's Bookings
                </Text>
              </TouchableOpacity>

              {/* Time Slots Grid */}
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
                      key={`${timeSlot}-${refreshTrigger}`}
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
                      {/* Time display */}
                      <Text
                        style={[
                          styles.timeSlotText,
                          status === "selected" && styles.selectedSlotText,
                          isBookedOrCompleted && styles.bookedSlotText,
                        ]}
                      >
                        {timeSlot}
                      </Text>

                      {/* Selected time range */}
                      {status === "selected" && (
                        <Text style={styles.timeRangeText}>
                          {formatTimeSlotRange(timeSlot)}
                        </Text>
                      )}

                      {/* Customer name for booked/completed */}
                      {booking &&
                        (status === "booked" || status === "completed") && (
                          <Text
                            style={styles.customerNameText}
                            numberOfLines={1}
                          >
                            {booking.customerName}
                          </Text>
                        )}

                      {/* Status indicators */}
                      {status === "completed" && (
                        <Text style={styles.completedShiningText}>
                          Completed
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
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
          )}
        </Animated.View>
      </PanGestureHandler>

      {/* Simplified Side Panel - Always visible when toggled */}
      {isTodayPanelVisible && (
        <View style={styles.sidePanelOverlay}>
          <TouchableOpacity
            style={styles.sidePanelBackdrop}
            onPress={() => {
              setIsTodayPanelVisible(false);
              translateX.value = withSpring(0);
              console.log("Backdrop tapped - closing side panel");
            }}
            activeOpacity={0.8}
          />
          <View style={styles.sidePanelContainer}>
            <View style={styles.sidePanelContent}>
              <View style={styles.sidePanelHeader}>
                <Text style={styles.sidePanelTitle}>Today's Bookings</Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsTodayPanelVisible(false);
                    translateX.value = withSpring(0);
                    console.log("Close button tapped - closing side panel");
                  }}
                  style={styles.sidePanelCloseButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.sidePanelScrollView}>
                {(() => {
                  const individualSlots = getTodayBookingsWithDetails();
                  console.log(
                    "Side Panel - Individual time slots:",
                    individualSlots
                  );
                  return individualSlots.length > 0;
                })() ? (
                  getTodayBookingsWithDetails().map((slot, index) => (
                    <View key={slot.id} style={styles.sidePanelBookingCard}>
                      <Text style={styles.sidePanelBookingTime}>
                        {slot.timeRange}
                      </Text>
                      <Text style={styles.sidePanelBookingName}>
                        {slot.customerDetails.name}
                      </Text>

                      {/* Clean contact info */}
                      <View style={styles.contactInfoContainer}>
                        <Text style={styles.contactInfoText}>
                          {slot.customerDetails.mobile}
                        </Text>
                        <Text style={styles.contactInfoText}>
                          {slot.customerDetails.city}
                        </Text>
                      </View>

                      {/* Complete button - only show if not already completed */}
                      {slot.status !== "completed" && (
                        <TouchableOpacity
                          style={styles.completeBookingButton}
                          onPress={() =>
                            handleCompleteBooking(
                              slot.bookingId,
                              slot.timeSlots
                            )
                          }
                        >
                          <Text style={styles.completeBookingButtonText}>
                            Complete
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Show completed status if already completed */}
                      {slot.status === "completed" && (
                        <View style={styles.completedStatusContainer}>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#10B981"
                          />
                          <Text style={styles.completedStatusText}>
                            Completed
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.sidePanelBookingCard}>
                    <Text style={styles.sidePanelBookingName}>
                      No bookings for today
                    </Text>
                    <Text style={styles.sidePanelBookingPhone}>
                      Check back later!
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      )}
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
  },
  scrollViewContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 48, // Reduced by 40% for less scroll space
    flexGrow: 1,
  },
  statsContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  statsTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  statsSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  // Compact Modern Calendar Styles
  calendarSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calendarSectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  fullCalendar: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  calendarMonthYear: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    paddingVertical: 8,
  },
  // Fixed Calendar Grid - Table-like structure
  fixedCalendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  calendarDayContainer: {
    width: "14.285%", // Exactly 100% / 7
    aspectRatio: 1,
    padding: 2,
  },
  fixedCalendarDay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 40,
  },
  fixedCalendarDayText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  todayDay: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedDay: {
    backgroundColor: "#059669", // Dark green - explicit color
    borderWidth: 2,
    borderColor: "#10B981", // Primary green border
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  // A2 Sports Park Header Styles
  headerSection: {
    marginBottom: SPACING.lg,
  },
  headerGradient: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    ...SHADOWS.medium,
    // Magical gradient effect
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.surface,
    textAlign: "center",
    marginBottom: SPACING.xs,
    letterSpacing: 1.2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.primaryLight,
    textAlign: "center",
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  headerAccent: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    backgroundColor: COLORS.primaryDark,
    borderRadius: 40,
    opacity: 0.3,
  },
  headerAccent2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 60,
    height: 60,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 30,
    opacity: 0.4,
  },
  disabledDay: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    opacity: 0.4,
  },
  calendarDayText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  selectedText: {
    color: "#FFFFFF", // White text for dark green background
    fontWeight: "700",
    fontSize: 16,
  },
  disabledText: {
    color: COLORS.textTertiary,
    fontWeight: "400",
  },
  filterContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  filterTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.xs,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 36,
    justifyContent: "center",
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.light,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  activeFilterButtonText: {
    color: COLORS.surface,
    fontWeight: "700",
  },
  timeSlotsContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xs,
    alignSelf: "flex-start",
    width: "100%",
    flexShrink: 0,
    overflow: "hidden",
    ...SHADOWS.light,
  },
  timeSlotsTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.lg,
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  timeSlot: {
    width: "30%",
    height: 70,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
    paddingVertical: 4,
  },
  disabledSlot: {
    opacity: 0.5,
  },
  bookedSlot: {
    backgroundColor: COLORS.background, // Light gray
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  // Available slots - clean white cards
  availableSlot: {
    backgroundColor: COLORS.surface, // White
    borderColor: COLORS.border, // Light gray border
  },
  // Selected slots - green theme
  selectedSlot: {
    backgroundColor: COLORS.primary, // Green
    borderColor: COLORS.primary,
  },
  bookedSlotText: {
    color: COLORS.textSecondary,
    // Removed textDecorationLine: "line-through" for cleaner look
  },
  bookedStatusText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  longPressHint: {
    fontSize: 6, // Smaller for elegant look
    color: "#9CA3AF", // Silver/gray color
    fontStyle: "italic",
    marginTop: 1, // Reduced spacing
    fontWeight: "300", // Very light weight
    lineHeight: 7,
    fontFamily: "System", // Clean system font
  },
  completedShiningText: {
    fontSize: 12, // Increased by 3 more (9 + 3 = 12)
    color: "#9CA3AF", // Same silver/gray color as longPressHint
    fontStyle: "italic",
    marginTop: 1, // Reduced spacing
    fontWeight: "500", // Medium weight for shine effect
    lineHeight: 13, // Adjusted line height for larger text
    fontFamily: "System", // Clean system font
    textShadowColor: "#9CA3AF", // Silver shadow for shine
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2, // Small glow effect
  },
  completedHint: {
    fontSize: 9,
    color: "#10B981", // Green color for completed
    fontStyle: "italic",
    marginTop: 3,
    fontWeight: "600",
  },
  completedSlot: {
    borderWidth: 2,
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  completedSlotText: {
    color: "#6B7280", // Silver color for elegant look
    fontWeight: "600",
  },
  completedStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  completedStatusCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 8,
  },
  completedTextCompact: {
    fontSize: 6, // Smaller for elegant look
    color: "#10B981",
    fontWeight: "500", // Lighter weight
    marginLeft: 2,
    lineHeight: 7,
    fontFamily: "System", // Clean system font
  },
  timeSlotText: {
    fontSize: 14, // Smaller for more elegant look
    fontWeight: "600", // Medium-bold weight
    color: "#6B7280", // Silver/gray color
    textAlign: "center",
    lineHeight: 16, // Tighter line height
    fontFamily: "System", // Clean system font
  },
  selectedSlotText: {
    color: COLORS.surface, // White text for selected slots
  },
  timeRangeText: {
    fontSize: 8, // Smaller for elegant look
    color: COLORS.surface, // White text for selected slots
    textAlign: "center",
    marginTop: 1, // Reduced margin
    opacity: 0.9,
    fontWeight: "400", // Lighter weight
    lineHeight: 9,
    fontFamily: "System", // Clean system font
  },
  customerNameText: {
    fontSize: 12, // 2 less than timeSlotText (14 - 2 = 12)
    color: "#10B981", // Green color for better visibility
    textAlign: "center",
    marginTop: 1, // Reduced margin
    fontWeight: "300", // Light weight
    opacity: 0.9, // Good visibility with green
    maxWidth: "75%", // Good fit
    lineHeight: 14, // Proportional line height
    fontFamily: "System", // Clean system font
  },
  statusText: {
    fontSize: 10,
    color: COLORS.textSecondary, // Gray text for status
    textAlign: "center",
  },
  proceedButton: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  disabledButton: {
    backgroundColor: COLORS.textTertiary,
  },
  proceedButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    margin: 20,
    maxHeight: "80%",
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  calendarWrapper: {
    padding: 0,
  },
  calendarText: {
    fontSize: 16,
    color: "#333",
  },
  dayText: {
    fontSize: 16,
    color: "#333",
  },
  todayText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  yearText: {
    fontSize: 16,
    color: "#666",
  },
  dayButton: {
    borderRadius: 20,
    margin: 2,
  },
  selectedDay: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
  },
  simplePanel: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  simplePanelTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  simplePanelSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  simpleBookingCard: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  simpleBookingTime: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 5,
  },
  simpleBookingName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  simpleBookingPhone: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  simpleBookingCity: {
    fontSize: 14,
    color: "#666",
  },
  simpleCloseBtn: {
    backgroundColor: "#10B981",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  simpleCloseBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  simpleToggleButton: {
    backgroundColor: "#10B981",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  simpleToggleButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  mainContent: {
    flex: 1,
  },
  mainContentTouchable: {
    flex: 1,
  },
  sidePanelOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  sidePanelBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sidePanelContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "80%",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  sidePanelContent: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
    minHeight: "100%",
  },
  debugPanelText: {
    color: "red",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sidePanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sidePanelTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  sidePanelCloseButton: {
    padding: 5,
  },
  sidePanelScrollView: {
    flex: 1,
  },
  sidePanelBookingCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  sidePanelBookingTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 5,
  },
  sidePanelBookingName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  sidePanelBookingPhone: {
    fontSize: 13,
    color: "#666",
    marginBottom: 3,
  },
  sidePanelBookingCity: {
    fontSize: 13,
    color: "#666",
  },
  sidePanelBookingStatus: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  cancelBookingButton: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  cancelBookingButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  completeBookingButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  completeBookingButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  completedStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  completedStatusText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  contactInfoContainer: {
    marginTop: 6,
    marginBottom: 4,
  },
  contactInfoText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
    fontWeight: "500",
  },
  todayPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flex: 1,
  },
  todayPanelTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  todayPanelSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  todayBookingsContent: {
    flex: 1,
  },
  todayBookingsList: {
    flex: 1,
  },
  todayBookingsScrollContent: {
    paddingBottom: SPACING.lg,
  },
  slotTimeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  timeSlotBadge: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    flex: 1,
    marginRight: SPACING.sm,
  },
  bookingItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  bookingTimeContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    flex: 1,
    marginRight: SPACING.sm,
  },
  bookingTimeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    minWidth: 80,
    alignItems: "center",
  },
  customerInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  customerAvatarText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  customerDetails: {
    flex: 1,
  },
  sidePanelCustomerNameText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: 4,
    fontWeight: "600",
  },
  customerContactInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contactText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontSize: 12,
  },
  timeRangeSection: {
    backgroundColor: COLORS.background,
    padding: SPACING.xs,
    borderRadius: RADIUS.sm,
    alignItems: "center",
  },
  bookingDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingDateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  bookingSlotsCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "600",
  },
  bookingStatusText: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyTodayBookings: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyTodayText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: "center",
    fontWeight: "600",
  },
  emptyTodaySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  debugText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
});
