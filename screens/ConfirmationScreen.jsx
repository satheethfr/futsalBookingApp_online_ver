// screens/ConfirmationScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";

export default function ConfirmationScreen({ route, navigation }) {
  const { selectedDate, selectedTimeSlots } = route.params;
  const {
    customers,
    isOffline,
    isUsingCache,
    addCustomer,
    addBooking,
    loadData,
  } = useApp();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    mobile: "",
    city: "",
  });

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.mobile.includes(searchQuery) ||
      customer.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirmBooking = async () => {
    if (isOffline || isUsingCache) {
      Alert.alert(
        "Offline Mode",
        "This action requires an internet connection.",
        [{ text: "OK" }]
      );
      return;
    }

    if (!selectedCustomer) {
      Alert.alert("Error", "Please select a customer");
      return;
    }

    setIsCreating(true);
    try {
      const bookingData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        date: selectedDate,
        timeSlots: selectedTimeSlots,
        status: "confirmed",
      };

      const result = await addBooking(bookingData);

      if (result.success) {
        // Force refresh of data to ensure UI updates
        await loadData();

        Alert.alert("Success", "Booking confirmed successfully!", [
          {
            text: "OK",
            onPress: () => navigation.navigate("Main"),
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create booking");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddCustomer = async () => {
    if (isOffline || isUsingCache) {
      Alert.alert(
        "Offline Mode",
        "This action requires an internet connection.",
        [{ text: "OK" }]
      );
      return;
    }

    if (!newCustomer.name || !newCustomer.mobile || !newCustomer.city) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsCreating(true);
    try {
      const result = await addCustomer(newCustomer);

      if (result.success) {
        setSelectedCustomer(result.data);
        setShowAddCustomerModal(false);
        setNewCustomer({ name: "", mobile: "", city: "" });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add customer");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Booking Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              </View>
              <Text style={styles.sectionTitle}>Booking Summary</Text>
            </View>
          </View>

          <View style={styles.bookingDetails}>
            <Text style={styles.bookingDetailText}>
              <Text style={styles.bold}>Date:</Text> {selectedDate}
            </Text>
            <Text style={styles.bookingDetailText}>
              <Text style={styles.bold}>Time Slots:</Text>{" "}
              {selectedTimeSlots.join(", ")}
            </Text>
            <Text style={styles.bookingDetailText}>
              <Text style={styles.bold}>Total Slots:</Text>{" "}
              {selectedTimeSlots.length}
            </Text>
          </View>
        </View>

        {/* Customer Selection */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="people-outline" size={20} color="#007AFF" />
              </View>
              <Text style={styles.sectionTitle}>Select Customer</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.customerList}>
            {filteredCustomers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                style={[
                  styles.customerItem,
                  selectedCustomer?.id === customer.id &&
                    styles.selectedCustomerItem,
                ]}
                onPress={() => setSelectedCustomer(customer)}
              >
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {customer.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerDetails}>
                    {customer.mobile} • {customer.city}
                  </Text>
                </View>
                {selectedCustomer?.id === customer.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.addCustomerButton}
            onPress={() => setShowAddCustomerModal(true)}
            disabled={isOffline || isUsingCache}
          >
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.addCustomerButtonText}>Add New Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Customer */}
        {selectedCustomer && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons
                    name="person-circle-outline"
                    size={20}
                    color="#007AFF"
                  />
                </View>
                <Text style={styles.sectionTitle}>Selected Customer</Text>
              </View>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => setSelectedCustomer(null)}
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectedCustomerDetailsContainer}>
              <View style={styles.selectedCustomerAvatar}>
                <Text style={styles.selectedCustomerAvatarText}>
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.selectedCustomerInfo}>
                <Text style={styles.selectedCustomerName}>
                  {selectedCustomer.name}
                </Text>
                <Text style={styles.selectedCustomerDetails}>
                  {selectedCustomer.mobile}
                </Text>
                <Text style={styles.selectedCustomerDetails}>
                  {selectedCustomer.city}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => setSelectedCustomer(null)}
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (isOffline || isUsingCache || !selectedCustomer || isCreating) &&
              styles.disabledButton,
          ]}
          onPress={handleConfirmBooking}
          disabled={
            isOffline || isUsingCache || !selectedCustomer || isCreating
          }
        >
          {isCreating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.confirmButtonText}>
              {isOffline || isUsingCache
                ? "Offline Mode - Actions Disabled"
                : "Confirm Booking"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Customer</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Name"
              value={newCustomer.name}
              onChangeText={(text) =>
                setNewCustomer((prev) => ({ ...prev, name: text }))
              }
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Mobile"
              value={newCustomer.mobile}
              onChangeText={(text) =>
                setNewCustomer((prev) => ({ ...prev, mobile: text }))
              }
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="City"
              value={newCustomer.city}
              onChangeText={(text) =>
                setNewCustomer((prev) => ({ ...prev, city: text }))
              }
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddCustomerModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={handleAddCustomer}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalAddButtonText}>Add Customer</Text>
                )}
              </TouchableOpacity>
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
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  bookingDetails: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
  },
  bookingDetailText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  bold: {
    fontWeight: "600",
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  customerList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  customerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  selectedCustomerItem: {
    backgroundColor: "#e3f2fd",
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  customerAvatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  customerDetails: {
    fontSize: 14,
    color: "#666",
  },
  addCustomerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderStyle: "dashed",
  },
  addCustomerButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  selectedCustomerDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
  },
  selectedCustomerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  selectedCustomerAvatarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  selectedCustomerInfo: {
    flex: 1,
  },
  selectedCustomerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  selectedCustomerDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  changeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  changeButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    marginRight: 10,
  },
  modalCancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  modalAddButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
    marginLeft: 10,
  },
  modalAddButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});
