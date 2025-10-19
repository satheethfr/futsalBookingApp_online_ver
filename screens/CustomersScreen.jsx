import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import Toast from "react-native-toast-message";

const CustomersScreen = ({ navigation }) => {
  const { customers, deleteCustomer, getUpcomingBookings, completeBooking } =
    useApp();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter customers based on search query
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.mobile.includes(searchQuery) ||
      (customer.city &&
        customer.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle customer press (navigate to profile)
  const handleCustomerPress = (customer) => {
    navigation.navigate("Profile", { customerId: customer.id });
  };

  // Handle customer long press (delete customer)
  const handleCustomerLongPress = (customer) => {
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${customer.name}? This will also delete all their bookings.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCustomer(customer.id);
            Toast.show({
              type: "success",
              text1: "Customer Deleted",
              text2: `${customer.name} has been deleted`,
            });
          },
        },
      ]
    );
  };

  // Handle complete time slot
  const handleCompleteTimeSlot = (bookingId, timeSlot) => {
    completeBooking(bookingId, timeSlot);
    Toast.show({
      type: "success",
      text1: "Time Slot Completed",
      text2: `${timeSlot} slot has been completed`,
    });

    setTimeout(() => {
      if (
        selectedCustomer &&
        getUpcomingBookings(selectedCustomer.id).length === 0
      ) {
        closeModal();
      }
    }, 1000);
  };

  // Close modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedCustomer(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Convert 24-hour format to 12-hour format with AM/PM
  const formatTimeTo12Hour = (time24) => {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get time range for a time slot
  const getTimeRange = (timeSlot) => {
    const startTime = formatTimeTo12Hour(timeSlot);
    const [hours, minutes] = timeSlot.split(":");
    const endHour = parseInt(hours) + 1;
    const endTime = formatTimeTo12Hour(
      `${endHour.toString().padStart(2, "0")}:${minutes}`
    );
    return `${startTime} - ${endTime}`;
  };

  // Render customer item
  const renderCustomerItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.customerItem}
        onPress={() => handleCustomerPress(item)}
        onLongPress={() => handleCustomerLongPress(item)}
        delayLongPress={1000}
      >
        <View style={styles.customerAvatar}>
          <Text style={styles.customerAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerMobile}>{item.mobile}</Text>
          {item.city && <Text style={styles.customerCity}>{item.city}</Text>}
          <View style={styles.customerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{item.totalBookings}</Text>
              <Text style={styles.statLabel}>BOOKINGS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{item.totalCancellations}</Text>
              <Text style={styles.statLabel}>CANCELLED</Text>
            </View>
          </View>
        </View>
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={24} color="#007AFF" />
          <Text style={styles.headerTitle}>Customers</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.customerCount}>{customers.length}</Text>
          <Text style={styles.customerCountLabel}>Customers</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#8E8E93"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Customer List */}
      {filteredCustomers.length > 0 ? (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No Customers Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? "Try adjusting your search"
              : "Customers will appear here after they make their first booking"}
          </Text>
        </View>
      )}

      {/* Upcoming Bookings Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Upcoming Bookings - {selectedCustomer?.name}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedCustomer &&
              getUpcomingBookings(selectedCustomer.id).length > 0 ? (
                getUpcomingBookings(selectedCustomer.id).map((booking) => (
                  <View key={booking.id} style={styles.bookingCard}>
                    <View style={styles.bookingHeader}>
                      <Text style={styles.bookingDate}>
                        {formatDate(booking.date)}
                      </Text>
                      <Text style={styles.bookingStatus}>
                        {booking.timeSlots.length} slot
                        {booking.timeSlots.length > 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View style={styles.timeSlotsContainer}>
                      {booking.timeSlots.map((timeSlot, index) => (
                        <View key={index} style={styles.timeSlotItem}>
                          <View style={styles.timeSlotInfo}>
                            <Text style={styles.timeSlotText}>
                              {getTimeRange(timeSlot)}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.completeButton}
                            onPress={() =>
                              handleCompleteTimeSlot(booking.id, timeSlot)
                            }
                          >
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#ffffff"
                            />
                            <Text style={styles.completeButtonText}>
                              Complete
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noBookingsContainer}>
                  <Text style={styles.noBookingsText}>
                    No upcoming bookings for {selectedCustomer?.name}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginLeft: 8,
  },
  headerRight: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  customerCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  customerCountLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1C1C1E",
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  customerItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  customerAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  customerMobile: {
    fontSize: 15,
    color: "#8E8E93",
    marginBottom: 2,
  },
  customerCity: {
    fontSize: 15,
    color: "#8E8E93",
    marginBottom: 12,
  },
  customerStats: {
    flexDirection: "row",
  },
  statItem: {
    marginRight: 20,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1C1C1E",
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#C7C7CC",
    textAlign: "center",
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1C1E",
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  bookingCard: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  bookingStatus: {
    fontSize: 14,
    color: "#8E8E93",
  },
  timeSlotsContainer: {
    gap: 10,
  },
  timeSlotItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
  },
  timeSlotInfo: {
    flex: 1,
  },
  timeSlotText: {
    fontSize: 14,
    color: "#1C1C1E",
    fontWeight: "500",
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#34C759",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  noBookingsContainer: {
    alignItems: "center",
    padding: 20,
  },
  noBookingsText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
});

export default CustomersScreen;
