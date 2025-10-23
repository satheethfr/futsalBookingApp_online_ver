// screens/ConfirmationScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        nestedScrollEnabled={true}
      >
        {/* Booking Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerIcon}>
              <Ionicons name="calendar" size={24} color={COLORS.surface} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.cardTitle}>Booking Summary</Text>
              <Text style={styles.cardSubtitle}>
                Review your selected time slots
              </Text>
            </View>
          </View>

          <View style={styles.bookingInfo}>
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Time Slots</Text>
              <Text style={styles.infoValue}>
                {selectedTimeSlots.join(" • ")}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="layers-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.infoLabel}>Total Slots</Text>
              <Text style={styles.infoValue}>
                {selectedTimeSlots.length} slot
                {selectedTimeSlots.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Selection Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerIcon}>
              <Ionicons name="people" size={24} color={COLORS.surface} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.cardTitle}>Select Customer</Text>
              <Text style={styles.cardSubtitle}>
                Choose from existing customers or add new
              </Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              placeholderTextColor={COLORS.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView
            style={styles.customerListContainer}
            showsVerticalScrollIndicator={true}
            bounces={false}
            nestedScrollEnabled={true}
          >
            {filteredCustomers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                style={[
                  styles.customerItem,
                  selectedCustomer?.id === customer.id &&
                    styles.selectedCustomerItem,
                ]}
                onPress={() => setSelectedCustomer(customer)}
                activeOpacity={0.7}
              >
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {customer.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Main Content Section */}
                <View style={styles.customerMainContent}>
                  {/* Name and Status Row */}
                  <View style={styles.customerHeader}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    {selectedCustomer?.id === customer.id && (
                      <View style={styles.statusBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={COLORS.success}
                        />
                        <Text style={styles.statusText}>Selected</Text>
                      </View>
                    )}
                  </View>

                  {/* Contact Info Section */}
                  <View style={styles.contactSection}>
                    <View style={styles.contactRow}>
                      <View style={styles.contactIcon}>
                        <Ionicons
                          name="call"
                          size={14}
                          color={COLORS.primary}
                        />
                      </View>
                      <Text style={styles.contactText}>{customer.mobile}</Text>
                    </View>

                    <View style={styles.contactRow}>
                      <View style={styles.contactIcon}>
                        <Ionicons
                          name="location"
                          size={14}
                          color={COLORS.primary}
                        />
                      </View>
                      <Text style={styles.contactText}>{customer.city}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.addCustomerButton}
            onPress={() => setShowAddCustomerModal(true)}
            disabled={isOffline || isUsingCache}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={COLORS.primary} />
            <Text style={styles.addCustomerButtonText}>Add New Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Enhanced Selected Customer Card */}
        {selectedCustomer && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerIcon}>
                <Ionicons name="person" size={24} color={COLORS.surface} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.cardTitle}>Selected Customer</Text>
                <Text style={styles.cardSubtitle}>
                  Ready to confirm booking
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => setSelectedCustomer(null)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* Enhanced Customer Details */}
            <View style={styles.enhancedCustomerContainer}>
              <View style={styles.customerMainInfo}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.customerDetails}>
                  <Text style={styles.customerName}>
                    {selectedCustomer.name}
                  </Text>
                  <View style={styles.contactInfo}>
                    <View style={styles.contactItem}>
                      <Ionicons
                        name="call"
                        size={14}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.contactText}>
                        {selectedCustomer.mobile}
                      </Text>
                    </View>
                    <View style={styles.contactItem}>
                      <Ionicons
                        name="location"
                        size={14}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.contactText}>
                        {selectedCustomer.city}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.statusIndicator}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.success}
                  />
                </View>
              </View>

              {/* Customer Stats */}
              <View style={styles.customerStats}>
                <View style={styles.statItem}>
                  <Ionicons name="calendar" size={16} color={COLORS.primary} />
                  <Text style={styles.statLabel}>Total Bookings</Text>
                  <Text style={styles.statValue}>5</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time" size={16} color={COLORS.success} />
                  <Text style={styles.statLabel}>Status</Text>
                  <Text style={styles.statValue}>Active</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.customerActions}>
                <TouchableOpacity style={styles.cancelButton}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={COLORS.error}
                  />
                  <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.viewHistoryButton}>
                  <Ionicons name="list" size={16} color={COLORS.primary} />
                  <Text style={styles.viewHistoryButtonText}>View History</Text>
                </TouchableOpacity>
              </View>
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
          activeOpacity={0.8}
        >
          {isCreating ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={COLORS.surface} />
              <Text style={styles.confirmButtonText}>
                {isOffline || isUsingCache
                  ? "Offline Mode - Actions Disabled"
                  : "Confirm Booking"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="person-add" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <Text style={styles.modalSubtitle}>
                Enter customer details to continue
              </Text>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={COLORS.textSecondary}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.textTertiary}
                  value={newCustomer.name}
                  onChangeText={(text) =>
                    setNewCustomer((prev) => ({ ...prev, name: text }))
                  }
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={COLORS.textSecondary}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Mobile Number"
                  placeholderTextColor={COLORS.textTertiary}
                  value={newCustomer.mobile}
                  onChangeText={(text) =>
                    setNewCustomer((prev) => ({ ...prev, mobile: text }))
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={COLORS.textSecondary}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="City"
                  placeholderTextColor={COLORS.textTertiary}
                  value={newCustomer.city}
                  onChangeText={(text) =>
                    setNewCustomer((prev) => ({ ...prev, city: text }))
                  }
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddCustomerModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={handleAddCustomer}
                disabled={isCreating}
                activeOpacity={0.8}
              >
                {isCreating ? (
                  <ActivityIndicator color={COLORS.surface} />
                ) : (
                  <>
                    <Ionicons name="add" size={18} color={COLORS.surface} />
                    <Text style={styles.modalAddButtonText}>Add Customer</Text>
                  </>
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
  // Container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  // Cards
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },

  // Card Headers
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
    ...SHADOWS.light,
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },

  // Booking Info
  bookingInfo: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    marginRight: SPACING.sm,
    minWidth: 80,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontWeight: "600",
    flex: 1,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },

  // Customer List
  customerListContainer: {
    height: 300,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  customerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
    elevation: 2,
  },
  selectedCustomerItem: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 2,
    ...SHADOWS.medium,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.lg,
    ...SHADOWS.medium,
    elevation: 3,
  },
  customerAvatarText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.surface,
    fontWeight: "700",
  },
  // Main content container
  customerMainContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  // Header with name and status
  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  customerName: {
    ...TYPOGRAPHY.h4,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
  },
  // Status badge for selected state
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success + "20",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: "600",
    marginLeft: 4,
  },
  // Contact section
  contactSection: {
    gap: SPACING.xs,
  },
  // Individual contact row
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  // Contact icon container
  contactIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  // Contact text
  contactText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: "500",
    flex: 1,
  },

  // Add Customer Button
  addCustomerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    backgroundColor: COLORS.primaryLight,
  },
  addCustomerButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },

  // Enhanced Customer Container
  enhancedCustomerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },

  // Customer Main Info
  customerMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
    ...SHADOWS.light,
  },
  customerAvatarText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.surface,
    fontWeight: "700",
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    ...TYPOGRAPHY.h4,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  contactInfo: {
    marginTop: SPACING.xs,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  contactText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  statusIndicator: {
    marginLeft: SPACING.sm,
  },

  // Customer Stats
  customerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontWeight: "600",
    marginTop: 2,
  },

  // Action Buttons
  customerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.error + "10",
    borderWidth: 1,
    borderColor: COLORS.error,
    marginRight: SPACING.sm,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: "600",
    marginLeft: 4,
  },
  viewHistoryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + "10",
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  viewHistoryButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Change Button
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changeButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Confirm Button
  confirmButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  disabledButton: {
    backgroundColor: COLORS.textTertiary,
  },
  confirmButtonText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.surface,
    fontWeight: "600",
    marginLeft: SPACING.sm,
  },

  // Modal
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: "90%",
    maxWidth: 400,
    ...SHADOWS.medium,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  modalSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  modalForm: {
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: "center",
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  modalAddButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
    ...SHADOWS.light,
  },
  modalAddButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.surface,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
});
