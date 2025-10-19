import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import Toast from "react-native-toast-message";

const ConfirmationScreen = ({ route, navigation }) => {
  const { selectedDate, selectedTimeSlots } = route.params;
  const { customers, addCustomer, addBooking } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    mobile: "",
    city: "",
  });
  const [errors, setErrors] = useState({});

  // Filter customers based on search query
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.mobile.includes(searchQuery) ||
      customer.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Validate new customer form
  const validateForm = () => {
    const newErrors = {};

    if (!newCustomer.name.trim()) {
      newErrors.name = "Name is required";
    } else if (newCustomer.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (newCustomer.name.trim().length > 15) {
      newErrors.name = "Name must not exceed 15 characters";
    }

    if (!newCustomer.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(newCustomer.mobile)) {
      newErrors.mobile = "Mobile number must be exactly 10 digits";
    }

    if (newCustomer.city.trim() && newCustomer.city.trim().length < 2) {
      newErrors.city = "City name must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };

  // Handle new customer form submission
  const handleNewCustomerSubmit = () => {
    if (validateForm()) {
      const customerData = {
        name: newCustomer.name.trim(),
        mobile: newCustomer.mobile.trim(),
        city: newCustomer.city.trim(),
      };

      addCustomer(customerData);
      setSelectedCustomer(customerData);
      setShowNewCustomerForm(false);
      setNewCustomer({ name: "", mobile: "", city: "" });
      setErrors({});

      Toast.show({
        type: "success",
        text1: "Customer Added",
        text2: `${customerData.name} has been added successfully`,
      });
    }
  };

  // Handle booking confirmation
  const handleConfirmBooking = () => {
    if (!selectedCustomer) {
      Alert.alert(
        "No Customer Selected",
        "Please select or add a customer to proceed."
      );
      return;
    }

    const bookingData = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      date: selectedDate,
      timeSlots: selectedTimeSlots,
    };

    addBooking(bookingData);

    Toast.show({
      type: "success",
      text1: "Booking Confirmed",
      text2: `Booking confirmed for ${selectedCustomer.name}`,
    });

    navigation.navigate("Main");
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

  // Convert 24-hour format to 12-hour format with AM/PM
  const formatTimeTo12Hour = (time24) => {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Booking Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>
                {formatDate(selectedDate)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>
                {selectedTimeSlots
                  .map((slot) => formatTimeTo12Hour(slot))
                  .join(", ")}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Slots</Text>
              <Text style={styles.summaryValue}>
                {selectedTimeSlots.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Customer</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Ionicons name="close" size={20} color="#999999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Customer List */}
          <View style={styles.customerList}>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.customerItem,
                    selectedCustomer?.id === customer.id &&
                      styles.selectedCustomerItem,
                  ]}
                  onPress={() => handleCustomerSelect(customer)}
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
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noCustomersContainer}>
                <Ionicons name="people-outline" size={40} color="#CCCCCC" />
                <Text style={styles.noCustomersText}>
                  {searchQuery
                    ? "No customers found"
                    : "No customers available"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Selected Customer */}
        {selectedCustomer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Customer</Text>
            <View style={styles.selectedCustomerCard}>
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

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.addCustomerButton}
            onPress={() => setShowNewCustomerForm(true)}
          >
            <Ionicons name="person-add" size={20} color="#FFFFFF" />
            <Text style={styles.addCustomerButtonText}>Add New Customer</Text>
          </TouchableOpacity>

          {selectedCustomer && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmBooking}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirm Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* New Customer Form Modal */}
      {showNewCustomerForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowNewCustomerForm(false);
                  setNewCustomer({ name: "", mobile: "", city: "" });
                  setErrors({});
                }}
              >
                <Ionicons name="close" size={24} color="#999999" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formContent}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Name *</Text>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Enter customer name"
                    value={newCustomer.name}
                    onChangeText={(text) =>
                      setNewCustomer({ ...newCustomer, name: text })
                    }
                    maxLength={15}
                  />
                  {errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Mobile Number *</Text>
                  <TextInput
                    style={[styles.input, errors.mobile && styles.inputError]}
                    placeholder="Enter 10-digit mobile number"
                    value={newCustomer.mobile}
                    onChangeText={(text) =>
                      setNewCustomer({ ...newCustomer, mobile: text })
                    }
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  {errors.mobile && (
                    <Text style={styles.errorText}>{errors.mobile}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={[styles.input, errors.city && styles.inputError]}
                    placeholder="Enter city name"
                    value={newCustomer.city}
                    onChangeText={(text) =>
                      setNewCustomer({ ...newCustomer, city: text })
                    }
                  />
                  {errors.city && (
                    <Text style={styles.errorText}>{errors.city}</Text>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowNewCustomerForm(false);
                  setNewCustomer({ name: "", mobile: "", city: "" });
                  setErrors({});
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleNewCustomerSubmit}
              >
                <Text style={styles.submitButtonText}>Add Customer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
    marginLeft: 12,
  },
  clearButton: {
    padding: 4,
  },
  customerList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  customerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedCustomerItem: {
    backgroundColor: "#F0F8FF",
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  customerAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  customerDetails: {
    fontSize: 14,
    color: "#666666",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  noCustomersContainer: {
    padding: 40,
    alignItems: "center",
  },
  noCustomersText: {
    fontSize: 16,
    color: "#999999",
    marginTop: 12,
  },
  selectedCustomerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  selectedCustomerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedCustomerAvatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  selectedCustomerInfo: {
    flex: 1,
  },
  selectedCustomerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  selectedCustomerDetails: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F0F8FF",
    borderRadius: 6,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  addCustomerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  addCustomerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34C759",
    borderRadius: 12,
    padding: 16,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
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
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 20,
    maxHeight: "80%",
    width: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  closeButton: {
    padding: 4,
  },
  formScrollView: {
    maxHeight: 300,
  },
  formContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1A1A1A",
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    backgroundColor: "#8E8E93",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ConfirmationScreen;
