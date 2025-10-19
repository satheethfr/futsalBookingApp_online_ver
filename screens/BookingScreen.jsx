import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

// Helper function to get today's date string in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`;
};

const BookingScreen = ({ navigation }) => {
  const {
    getBookingsForDate,
    isTimeSlotBooked,
    cancelBooking,
    addBooking,
    cleanupTestBookings,
    customers,
    bookings,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [timeFilter, setTimeFilter] = useState("All");
  const [calendarKey, setCalendarKey] = useState(0);

  // Initialize with today's date
  useEffect(() => {
    setSelectedDate(getTodayDateString());
  }, []);

  // Clear selected time slots when returning to this screen
  useFocusEffect(
    React.useCallback(() => {
      setSelectedTimeSlots([]);
    }, [])
  );

  // Force calendar re-render when bookings change
  useEffect(() => {
    setCalendarKey((prev) => prev + 1);
  }, [bookings]);

  // Check if a date is in the past
  const isPastDate = (dateString) => {
    return dateString < getTodayDateString();
  };

  // Generate marked dates with dots for upcoming bookings
  const getMarkedDates = () => {
    const marked = {
      [selectedDate]: {
        selected: true,
      },
    };

    const todayString = getTodayDateString();

    // Get all bookings and check for future dates with confirmed bookings
    const dateBookingsMap = {};
    bookings.forEach((booking) => {
      if (booking.status === "confirmed") {
        if (!dateBookingsMap[booking.date]) {
          dateBookingsMap[booking.date] = [];
        }
        dateBookingsMap[booking.date].push(booking);
      }
    });

    // Add dots for future dates with bookings
    Object.keys(dateBookingsMap).forEach((dateString) => {
      if (dateString > todayString) {
        const dayBookings = dateBookingsMap[dateString];
        if (dayBookings && dayBookings.length > 0) {
          marked[dateString] = {
            marked: true,
            dotColor: "#007AFF",
          };
        }
      }
    });

    return marked;
  };

  // Handle date selection with past date validation
  const handleDateSelection = (day) => {
    const todayString = getTodayDateString();

    if (isPastDate(day.dateString)) {
      Toast.show({
        type: "error",
        text1: "Past Date Selected",
        text2: "You cannot book slots for past dates",
      });
      return;
    }
    setSelectedDate(day.dateString);
  };

  // Generate 24-hour time slots
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  // Filter time slots based on selected filter
  const getFilteredTimeSlots = () => {
    let result;
    switch (timeFilter) {
      case "Early Bird":
        result = timeSlots.filter((slot) => {
          const hour = parseInt(slot.split(":")[0]);
          return hour >= 0 && hour < 8;
        });
        break;
      case "Day Shift":
        result = timeSlots.filter((slot) => {
          const hour = parseInt(slot.split(":")[0]);
          return hour >= 8 && hour < 15;
        });
        break;
      case "Prime Time":
        result = timeSlots.filter((slot) => {
          const hour = parseInt(slot.split(":")[0]);
          return hour >= 15 && hour < 24;
        });
        break;
      default:
        result = timeSlots;
    }
    return result;
  };

  // Get today's booked slots count
  const getTodaysBookedSlots = () => {
    const today = getTodayDateString();
    const todaysBookings = getBookingsForDate(today);
    return todaysBookings.reduce(
      (total, booking) => total + booking.timeSlots.length,
      0
    );
  };

  // Check if time slot is completed
  const isTimeSlotCompleted = (date, timeSlot) => {
    const dayBookings = bookings.filter((booking) => booking.date === date);
    return dayBookings.some(
      (booking) =>
        booking.completedSlots && booking.completedSlots.includes(timeSlot)
    );
  };

  // Check if time slot is cancelled
  const isTimeSlotCancelled = (date, timeSlot) => {
    const dayBookings = bookings.filter(
      (booking) => booking.date === date && booking.status === "confirmed"
    );
    return dayBookings.some(
      (booking) =>
        booking.cancelledSlots && booking.cancelledSlots.includes(timeSlot)
    );
  };

  // Handle time slot selection with forced UI updates
  const handleTimeSlotPress = (timeSlot) => {
    console.log(`🎯 handleTimeSlotPress called for ${timeSlot}`);

    const isCompleted = isTimeSlotCompleted(selectedDate, timeSlot);
    const isCancelled = isTimeSlotCancelled(selectedDate, timeSlot);
    const isBooked = isTimeSlotBooked(selectedDate, timeSlot);

    console.log(
      `🎯 Status check: completed=${isCompleted}, cancelled=${isCancelled}, booked=${isBooked}`
    );

    // Can't select completed slots
    if (isCompleted) {
      console.log(`🎯 Cannot select completed slot ${timeSlot}`);
      return;
    }

    // Can't select booked slots (unless they're cancelled)
    if (isBooked && !isCancelled) {
      console.log(`🎯 Cannot select booked slot ${timeSlot}`);
      return;
    }

    console.log(`🎯 Allowing selection of slot ${timeSlot}`);

    // Force immediate UI update with multiple approaches
    setSelectedTimeSlots((prev) => {
      const newSelection = prev.includes(timeSlot)
        ? prev.filter((slot) => slot !== timeSlot)
        : [...prev, timeSlot];

      console.log(`🎯 New selection: [${newSelection.join(", ")}]`);
      return newSelection;
    });

    // Force a re-render by updating calendar key
    setCalendarKey((prev) => prev + 1);
  };

  // Handle time slot press (for both regular press and long press)
  const handleTimeSlotTouch = (timeSlot, isLongPress = false) => {
    const status = getTimeSlotStatus(timeSlot);

    if (status === "booked") {
      if (isLongPress) {
        handleLongPressTimeSlot(timeSlot);
      }
      return;
    }

    if (!isLongPress) {
      handleTimeSlotPress(timeSlot);
    }
  };

  // Get time slot status with enhanced logging
  const getTimeSlotStatus = (timeSlot) => {
    const isCompleted = isTimeSlotCompleted(selectedDate, timeSlot);
    const isCancelled = isTimeSlotCancelled(selectedDate, timeSlot);
    const isBooked = isTimeSlotBooked(selectedDate, timeSlot);
    const isSelected = selectedTimeSlots.includes(timeSlot);

    console.log(
      `🎨 getTimeSlotStatus for ${timeSlot}: completed=${isCompleted}, cancelled=${isCancelled}, booked=${isBooked}, selected=${isSelected}`
    );

    // If selected, always show as selected (regardless of other statuses)
    if (isSelected) {
      console.log(`🎨 Returning "selected" for ${timeSlot}`);
      return "selected";
    }

    // If completed, show as completed
    if (isCompleted) {
      console.log(`🎨 Returning "completed" for ${timeSlot}`);
      return "completed";
    }

    // If booked, show as booked (prioritize booked over cancelled)
    if (isBooked) {
      console.log(`🎨 Returning "booked" for ${timeSlot}`);
      return "booked";
    }

    // If cancelled, show as available (can be selected)
    if (isCancelled) {
      console.log(`🎨 Returning "available" for ${timeSlot} (cancelled)`);
      return "available";
    }

    // Everything else shows as available
    console.log(`🎨 Returning "available" for ${timeSlot} (default)`);
    return "available";
  };

  // Get booking details for a specific time slot
  const getBookingForTimeSlot = (timeSlot) => {
    const allDayBookings = bookings.filter(
      (booking) => booking.date === selectedDate
    );

    // First try to find active booking (slot in timeSlots)
    const activeBooking = allDayBookings.find((booking) =>
      booking.timeSlots.includes(timeSlot)
    );

    if (activeBooking) return activeBooking;

    // If no active booking, find cancelled/completed booking
    return allDayBookings.find(
      (booking) =>
        (booking.completedSlots && booking.completedSlots.includes(timeSlot)) ||
        (booking.cancelledSlots && booking.cancelledSlots.includes(timeSlot))
    );
  };

  // Handle long press on booked time slot
  const handleLongPressTimeSlot = (timeSlot) => {
    // Only allow cancellation of booked slots (not completed or cancelled)
    if (!isTimeSlotBooked(selectedDate, timeSlot)) {
      return;
    }

    const booking = getBookingForTimeSlot(timeSlot);

    if (booking) {
      const customer = customers.find((c) => c.id === booking.customerId);
      const customerName = customer ? customer.name : booking.customerName;

      Alert.alert(
        "Cancel Time Slot",
        `Are you sure you want to cancel the ${timeSlot} slot for ${customerName}?`,
        [
          {
            text: "No",
            style: "cancel",
          },
          {
            text: "Yes",
            style: "destructive",
            onPress: () => {
              cancelBooking(booking.id, timeSlot);
              Toast.show({
                type: "success",
                text1: "Time Slot Cancelled",
                text2: `${timeSlot} slot for ${customerName} has been cancelled`,
              });
            },
          },
        ]
      );
    }
  };

  // Convert 24-hour format to 12-hour format with AM/PM
  const formatTimeTo12Hour = (time24) => {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get time range for a time slot (e.g., "3:00 PM - 4:00 PM")
  const getTimeRange = (timeSlot) => {
    const startTime = formatTimeTo12Hour(timeSlot);
    const [hours, minutes] = timeSlot.split(":");
    const endHour = parseInt(hours) + 1;
    const endTime = formatTimeTo12Hour(
      `${endHour.toString().padStart(2, "0")}:${minutes}`
    );
    return `${startTime} - ${endTime}`;
  };

  // Handle proceed to booking
  const handleProceedToBook = () => {
    if (selectedTimeSlots.length === 0) {
      Alert.alert(
        "No Slots Selected",
        "Please select at least one time slot to proceed."
      );
      return;
    }

    navigation.navigate("Confirmation", {
      selectedDate,
      selectedTimeSlots: selectedTimeSlots.sort(),
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const filteredTimeSlots = getFilteredTimeSlots();

  // Check current booking state for debugging
  const checkBookingState = (date, timeSlot) => {
    const isBooked = isTimeSlotBooked(date, timeSlot);
    const isCancelled = isTimeSlotCancelled(date, timeSlot);
    const isCompleted = isTimeSlotCompleted(date, timeSlot);
    const status = getTimeSlotStatus(timeSlot);

    console.log(`🔍 BOOKING STATE CHECK for ${timeSlot}:`);
    console.log(`  isBooked: ${isBooked}`);
    console.log(`  isCancelled: ${isCancelled}`);
    console.log(`  isCompleted: ${isCompleted}`);
    console.log(`  status: ${status}`);
    console.log(`  selectedTimeSlots: [${selectedTimeSlots.join(", ")}]`);

    return { isBooked, isCancelled, isCompleted, status };
  };

  // AI Automated Test - Keeps running until UI works properly
  const runAITest = () => {
    console.log(
      "🤖 AI TEST STARTING - Will keep running until UI works properly"
    );

    let testAttempt = 0;
    const maxAttempts = 10;

    const runTestCycle = () => {
      testAttempt++;
      console.log(`\n🔄 AI TEST CYCLE ${testAttempt}/${maxAttempts}`);

      const testDate = "2025-11-15";
      const testTimeSlot = "14:00";
      const testCustomer = customers[0];

      if (!testCustomer) {
        console.log("❌ No customers available for test");
        return;
      }

      // Step 0: Clean up any existing test data for this date/slot
      console.log("🧹 Step 0: Cleaning up existing test data");
      cleanupTestBookings();

      // Step 1: Clear any existing selections
      setSelectedTimeSlots([]);
      setSelectedDate(testDate);

      setTimeout(() => {
        // Step 2: Book the slot
        console.log("📝 Step 2: Booking slot", testTimeSlot);
        addBooking({
          customerId: testCustomer.id,
          customerName: testCustomer.name,
          date: testDate,
          timeSlots: [testTimeSlot],
        });

        setTimeout(() => {
          // Step 3: Verify booking
          const isBooked = isTimeSlotBooked(testDate, testTimeSlot);
          console.log("📝 Step 3: Slot booked?", isBooked);

          if (isBooked) {
            // Step 4: Cancel the slot
            const booking = getBookingsForDate(testDate).find((b) =>
              b.timeSlots.includes(testTimeSlot)
            );

            if (booking) {
              console.log("📝 Step 4: Cancelling slot");
              cancelBooking({
                bookingId: booking.id,
                timeSlot: testTimeSlot,
              });

              setTimeout(() => {
                // Step 5: Check cancellation
                const isCancelled = isTimeSlotCancelled(testDate, testTimeSlot);
                const isBookedAfterCancel = isTimeSlotBooked(
                  testDate,
                  testTimeSlot
                );
                console.log("📝 Step 5: Slot cancelled?", isCancelled);
                console.log(
                  "📝 Step 5: Slot still booked?",
                  isBookedAfterCancel
                );

                if (isCancelled && !isBookedAfterCancel) {
                  // Step 6: Try to select the cancelled slot
                  console.log("📝 Step 6: Attempting to select cancelled slot");

                  // Force a re-render before selection
                  setSelectedTimeSlots([]);

                  setTimeout(() => {
                    handleTimeSlotPress(testTimeSlot);

                    setTimeout(() => {
                      // Step 7: Check if selection worked
                      const isSelected =
                        selectedTimeSlots.includes(testTimeSlot);
                      const status = getTimeSlotStatus(testTimeSlot);
                      console.log("📝 Step 7: Slot selected?", isSelected);
                      console.log("📝 Step 7: Slot status:", status);
                      console.log(
                        "📝 Step 7: Selected slots:",
                        selectedTimeSlots
                      );

                      if (isSelected && status === "selected") {
                        console.log(
                          "✅ SUCCESS: Cancelled slot can be selected!"
                        );

                        // Step 8: Test re-booking
                        console.log("📝 Step 8: Testing re-booking");
                        addBooking({
                          customerId: testCustomer.id,
                          customerName: testCustomer.name,
                          date: testDate,
                          timeSlots: [testTimeSlot],
                        });

                        setTimeout(() => {
                          const finalBooked = isTimeSlotBooked(
                            testDate,
                            testTimeSlot
                          );
                          console.log(
                            "📝 Step 9: Final booking status:",
                            finalBooked
                          );

                          if (finalBooked) {
                            console.log(
                              "🎉 AI TEST COMPLETE: Full flow works perfectly!"
                            );
                            return; // Success - stop testing
                          } else {
                            console.log(
                              "❌ Re-booking failed, trying again..."
                            );
                            if (testAttempt < maxAttempts) {
                              setTimeout(runTestCycle, 1000);
                            }
                          }
                        }, 500);
                      } else {
                        console.log(
                          "❌ Selection failed, trying different approach..."
                        );

                        // Try different approaches
                        if (testAttempt === 1) {
                          console.log(
                            "🔧 Approach 1: Force component re-render"
                          );
                          setSelectedDate("2025-11-16");
                          setTimeout(() => setSelectedDate(testDate), 100);
                        } else if (testAttempt === 2) {
                          console.log("🔧 Approach 2: Clear and re-select");
                          setSelectedTimeSlots([]);
                          setTimeout(
                            () => handleTimeSlotPress(testTimeSlot),
                            100
                          );
                        } else if (testAttempt === 3) {
                          console.log(
                            "🔧 Approach 3: Multiple selection attempts"
                          );
                          for (let i = 0; i < 3; i++) {
                            setTimeout(
                              () => handleTimeSlotPress(testTimeSlot),
                              i * 100
                            );
                          }
                        } else {
                          console.log("🔧 Approach 4: Force state update");
                          setSelectedTimeSlots((prev) => [
                            ...prev,
                            testTimeSlot,
                          ]);
                        }

                        if (testAttempt < maxAttempts) {
                          setTimeout(runTestCycle, 2000);
                        }
                      }
                    }, 500);
                  }, 200);
                } else {
                  console.log("❌ Cancellation failed, trying again...");
                  if (testAttempt < maxAttempts) {
                    setTimeout(runTestCycle, 1000);
                  }
                }
              }, 500);
            } else {
              console.log(
                "❌ Could not find booking to cancel, trying again..."
              );
              if (testAttempt < maxAttempts) {
                setTimeout(runTestCycle, 1000);
              }
            }
          } else {
            console.log("❌ Initial booking failed, trying again...");
            if (testAttempt < maxAttempts) {
              setTimeout(runTestCycle, 1000);
            }
          }
        }, 500);
      }, 500);
    };

    // Start the test cycle
    runTestCycle();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        {/* Grass Texture Layers */}
        <View style={styles.grassTexture} />
        <View style={styles.grassPattern1} />
        <View style={styles.grassPattern2} />
        <View style={styles.grassPattern3} />

        {/* Metallic Shine Overlay */}
        <View style={styles.metallicShine} />

        {/* Title */}
        <Text style={styles.title}>A2 Sports Park</Text>

        {/* AI Test Button */}
        <TouchableOpacity style={styles.testButton} onPress={runAITest}>
          <Text style={styles.testButtonText}>🤖 AI Test</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Stats Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Today's Booked Slots</Text>
        <Text style={styles.statsNumber}>{getTodaysBookedSlots()}</Text>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <Calendar
          key={calendarKey}
          current={selectedDate}
          onDayPress={handleDateSelection}
          monthFormat={"MMMM yyyy"}
          hideArrows={false}
          hideExtraDays={true}
          firstDay={1}
          showWeekNumbers={false}
          disableMonthChange={false}
          enableSwipeMonths={false}
          markingType={"simple"}
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: "#ffffff",
            calendarBackground: "#ffffff",
            textSectionTitleColor: "#b6c1cd",
            arrowColor: "#007AFF",
            monthTextColor: "#2d4150",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "300",
            textDayHeaderFontSize: 13,
          }}
        />
      </View>

      {/* Selected Date Display */}
      <View style={styles.selectedDateContainer}>
        <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
      </View>

      {/* Time Filter Pills */}
      <View style={styles.filterContainer}>
        {["All", "Early Bird", "Day Shift", "Prime Time"].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterPill,
              timeFilter === filter && styles.filterPillActive,
            ]}
            onPress={() => setTimeFilter(filter)}
          >
            <Text
              style={[
                styles.filterPillText,
                timeFilter === filter && styles.filterPillTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Time Slots Grid */}
      <View style={styles.timeSlotsContainer}>
        <Text style={styles.timeSlotsTitle}>Available Time Slots</Text>
        <View style={styles.timeSlotsGrid}>
          {filteredTimeSlots.map((timeSlot) => {
            const status = getTimeSlotStatus(timeSlot);
            return (
              <TouchableOpacity
                key={timeSlot}
                style={[
                  styles.timeSlot,
                  status === "booked" && styles.timeSlotBooked,
                  status === "completed" && styles.timeSlotCompleted,
                  status === "selected" && styles.timeSlotSelected,
                  status === "available" && styles.timeSlotAvailable,
                ]}
                onPress={() => handleTimeSlotTouch(timeSlot, false)}
                onLongPress={() => handleTimeSlotTouch(timeSlot, true)}
                delayLongPress={500}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    status === "booked" && styles.timeSlotTextBooked,
                    status === "completed" && styles.timeSlotTextCompleted,
                    status === "selected" && styles.timeSlotTextSelected,
                    status === "available" && styles.timeSlotTextAvailable,
                  ]}
                >
                  {timeSlot}
                </Text>
                {status === "selected" && (
                  <View style={styles.timeRangeContainer}>
                    <Text style={styles.timeRangeText}>
                      {getTimeRange(timeSlot)}
                    </Text>
                  </View>
                )}
                {status === "booked" && (
                  <>
                    <Text style={styles.customerNameText}>
                      {(() => {
                        const booking = getBookingForTimeSlot(timeSlot);
                        if (booking && booking.timeSlots.includes(timeSlot)) {
                          const customer = customers.find(
                            (c) => c.id === booking.customerId
                          );
                          return customer
                            ? customer.name
                            : booking.customerName;
                        }
                        return "";
                      })()}
                    </Text>
                    <Text style={styles.longPressHint}>Hold to cancel</Text>
                  </>
                )}
                {status === "completed" && (
                  <Text style={styles.completedText}>Completed</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Proceed Button */}
      {selectedTimeSlots.length > 0 && (
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceedToBook}
        >
          <Text style={styles.proceedButtonText}>Proceed to Book</Text>
          <Text style={styles.proceedButtonSubtext}>
            {selectedTimeSlots.length} slot
            {selectedTimeSlots.length > 1 ? "s" : ""} selected
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomSpacing} />
      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#1e3a8a",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#1e40af",
    overflow: "hidden",
  },
  grassTexture: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1e3a8a",
  },
  grassPattern1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transform: [{ skewX: "15deg" }],
  },
  grassPattern2: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    transform: [{ skewX: "-15deg" }],
  },
  grassPattern3: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    transform: [{ skewY: "5deg" }],
  },
  metallicShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    transform: [{ skewX: "45deg" }],
    opacity: 0.6,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ff69b4",
    textAlign: "center",
    textShadowColor: "#1e40af",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 10,
    position: "relative",
    letterSpacing: 1,
  },
  testButton: {
    backgroundColor: "#ff6b35",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: "center",
    shadowColor: "#ff6b35",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  statsCard: {
    margin: 20,
    padding: 24,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statsTitle: {
    fontSize: 18,
    color: "#2d4150",
    fontWeight: "600",
    marginBottom: 8,
  },
  statsNumber: {
    fontSize: 48,
    color: "#007AFF",
    fontWeight: "bold",
  },
  calendarContainer: {
    margin: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDateContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d4150",
    textAlign: "center",
  },
  filterContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e9ecef",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  filterPillActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6c757d",
  },
  filterPillTextActive: {
    color: "#ffffff",
  },
  timeSlotsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  timeSlotsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d4150",
    marginBottom: 15,
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  timeSlot: {
    width: (width - 60) / 3,
    height: 70,
    marginBottom: 10,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  timeSlotAvailable: {
    backgroundColor: "#ffffff",
    borderColor: "#dee2e6",
  },
  timeSlotSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotBooked: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
  },
  timeSlotCompleted: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: "500",
  },
  timeSlotTextAvailable: {
    color: "#495057",
  },
  timeSlotTextSelected: {
    color: "#ffffff",
  },
  timeRangeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 3,
  },
  timeRangeText: {
    fontSize: 8,
    color: "#ffffff",
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  timeSlotTextBooked: {
    color: "#adb5bd",
  },
  timeSlotTextCompleted: {
    color: "#adb5bd",
  },
  completedText: {
    fontSize: 10,
    color: "#6c757d",
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
  customerNameText: {
    fontSize: 10,
    color: "#6c757d",
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
  longPressHint: {
    fontSize: 8,
    color: "#dc3545",
    fontWeight: "500",
    marginTop: 1,
    textAlign: "center",
  },
  proceedButton: {
    marginHorizontal: 40,
    marginVertical: 20,
    padding: 16,
    backgroundColor: "#28a745",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  proceedButtonSubtext: {
    fontSize: 12,
    fontWeight: "400",
    color: "#ffffff",
    opacity: 0.8,
    marginTop: 2,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default BookingScreen;
