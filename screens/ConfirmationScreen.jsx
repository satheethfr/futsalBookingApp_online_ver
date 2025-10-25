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

  const filteredCustomers = customers
    .filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.mobile.includes(searchQuery) ||
        customer.city.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by customer name

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
                {/* Customer Name Section (2/4 height) */}
                <View
                  style={[
                    styles.nameSection,
                    selectedCustomer?.id === customer.id &&
                      styles.selectedNameSection,
                  ]}
                >
                  <Text style={styles.customerName}>{customer.name}</Text>
                  {selectedCustomer?.id === customer.id && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={COLORS.success}
                      />
                    </View>
                  )}
                </View>

                {/* Phone Number Section (1/4 height) */}
                <View
                  style={[
                    styles.phoneSection,
                    selectedCustomer?.id === customer.id &&
                      styles.selectedPhoneSection,
                  ]}
                >
                  <Text style={styles.phoneText}>{customer.mobile}</Text>
                </View>

                {/* City Section (1/4 height) */}
                <View
                  style={[
                    styles.citySection,
                    selectedCustomer?.id === customer.id &&
                      styles.selectedCitySection,
                  ]}
                >
                  <Text style={styles.cityText}>{customer.city}</Text>
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

        {/* Professional Minimalist Selected Customer Card */}
        {selectedCustomer && (
          <View style={styles.professionalCard}>
            {/* Header Section */}
            <View style={styles.professionalHeader}>
              <View style={styles.professionalTitleSection}>
                <View style={styles.titleIconContainer}>
                  <Ionicons name="person" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.professionalTitle}>Selected Customer</Text>
              </View>
              <TouchableOpacity
                style={styles.professionalChangeButton}
                onPress={() => setSelectedCustomer(null)}
                activeOpacity={0.6}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.professionalChangeText}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* Customer Profile Section */}
            <View style={styles.professionalProfile}>
              <View style={styles.professionalAvatarSection}>
                <View style={styles.professionalAvatar}>
                  <Text style={styles.professionalAvatarText}>
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.professionalBadge}>
                  <Text style={styles.professionalBadgeText}>VIP</Text>
                </View>
              </View>

              <View style={styles.professionalDetails}>
                <Text style={styles.professionalCustomerName}>
                  {selectedCustomer.name}
                </Text>
                <Text style={styles.professionalCustomerRole}>
                  Premium Member
                </Text>

                <View style={styles.professionalContactSection}>
                  <View style={styles.professionalContactRow}>
                    <View style={styles.professionalContactIcon}>
                      <Ionicons
                        name="call"
                        size={12}
                        color={COLORS.textSecondary}
                      />
                    </View>
                    <Text style={styles.professionalContactText}>
                      {selectedCustomer.mobile}
                    </Text>
                  </View>

                  <View style={styles.professionalContactRow}>
                    <View style={styles.professionalContactIcon}>
                      <Ionicons
                        name="location"
                        size={12}
                        color={COLORS.textSecondary}
                      />
                    </View>
                    <Text style={styles.professionalContactText}>
                      {selectedCustomer.city}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Statistics Section */}
            <View style={styles.professionalStatsSection}>
              <View style={styles.professionalStatItem}>
                <View style={styles.professionalStatHeader}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={styles.professionalStatTitle}>
                    Total Bookings
                  </Text>
                </View>
                <Text style={styles.professionalStatValue}>
                  {selectedCustomer.totalBookings || 0}
                </Text>
                <View style={styles.professionalStatBar}>
                  <View
                    style={[styles.professionalStatBarFill, { width: "85%" }]}
                  />
                </View>
              </View>

              <View style={styles.professionalStatItem}>
                <View style={styles.professionalStatHeader}>
                  <Ionicons
                    name="close-circle-outline"
                    size={16}
                    color={COLORS.error}
                  />
                  <Text style={styles.professionalStatTitle}>
                    Cancellations
                  </Text>
                </View>
                <Text style={styles.professionalStatValue}>
                  {selectedCustomer.totalCancellations || 0}
                </Text>
                <View style={styles.professionalStatBar}>
                  <View
                    style={[
                      styles.professionalStatBarFill,
                      { width: "15%", backgroundColor: COLORS.error },
                    ]}
                  />
                </View>
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
    flexDirection: "column", // Changed to vertical layout
    height: 140, // Increased height for better visibility
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.light,
    elevation: 2,
  },
  selectedCustomerItem: {
    backgroundColor: "#F0FDF4", // Green-50
    borderColor: "#22C55E", // Green-500
    borderWidth: 2,
    ...SHADOWS.medium,
    elevation: 4,
  },
  // Name section (striking gradient + magical shadow line)
  nameSection: {
    height: 60, // Reduced from 80px to 60px for better balance
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.sm, // Reduced padding from SPACING.md to SPACING.sm
    backgroundColor: COLORS.primary, // Full primary color background
    borderLeftWidth: 4, // Thicker accent border
    borderLeftColor: COLORS.success, // Green accent border
    borderBottomWidth: 3, // Thicker glowing border
    borderBottomColor: COLORS.success, // Green glow border
    ...SHADOWS.medium, // Add shadow for depth and impact
    // Add magical glowing shadow effect to the separating line
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8, // Higher elevation for more magical depth
  },
  customerName: {
    ...TYPOGRAPHY.body, // Reduced font size for better fit
    fontWeight: "700",
    color: COLORS.surface, // White text on primary background for high contrast
    flex: 1,
    numberOfLines: 1,
    ellipsizeMode: "tail",
    lineHeight: 18, // Explicit line height to prevent text clipping
  },
  // Checkmark container
  checkmarkContainer: {
    marginLeft: SPACING.sm,
    flexShrink: 0,
  },
  // Phone section (secondary - light contrast)
  phoneSection: {
    height: 40, // Increased from 30px to 40px for better visibility
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.xs,
    backgroundColor: "#F8FAFC", // Light gray contrast background
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  phoneText: {
    ...TYPOGRAPHY.caption, // Reduced font size for better fit
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
    numberOfLines: 1,
    ellipsizeMode: "tail",
  },
  // City section (secondary - light contrast)
  citySection: {
    height: 40, // Increased from 30px to 40px for better visibility
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.xs,
    backgroundColor: "#F1F5F9", // Slightly different light gray for variety
  },
  cityText: {
    ...TYPOGRAPHY.caption, // Reduced font size for better fit
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
    numberOfLines: 1,
    ellipsizeMode: "tail",
  },
  // Selected state styles for green theme
  selectedNameSection: {
    // No border styles needed
  },
  selectedPhoneSection: {
    borderBottomColor: "#D1FAE5", // Green-200
  },
  selectedCitySection: {
    // No border styles needed
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

  // Section Card (reusable card style)
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },

  // Professional Minimalist Card
  professionalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.light,
  },

  // Professional Header
  professionalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  professionalTitleSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  titleIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
  },

  professionalTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  professionalChangeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + "10",
  },

  professionalChangeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },

  // Professional Profile
  professionalProfile: {
    flexDirection: "row",
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
  },

  professionalAvatarSection: {
    position: "relative",
    marginRight: SPACING.lg,
  },

  professionalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.light,
  },

  professionalAvatarText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.surface,
    fontWeight: "700",
  },

  professionalBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFD700",
    borderRadius: 8,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },

  professionalBadgeText: {
    ...TYPOGRAPHY.caption,
    color: "#B8860B",
    fontWeight: "700",
    fontSize: 10,
  },

  professionalDetails: {
    flex: 1,
    justifyContent: "center",
  },

  professionalCustomerName: {
    ...TYPOGRAPHY.h4,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },

  professionalCustomerRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  professionalContactSection: {
    marginTop: SPACING.xs,
  },

  professionalContactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },

  professionalContactIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
  },

  professionalContactText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  // Professional Statistics
  professionalStatsSection: {
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  professionalStatItem: {
    marginBottom: SPACING.lg,
  },

  professionalStatHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },

  professionalStatTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginLeft: SPACING.sm,
  },

  professionalStatValue: {
    ...TYPOGRAPHY.h3,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },

  professionalStatBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: "hidden",
  },

  professionalStatBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  // Selected Customer Header
  selectedCustomerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  selectedCustomerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  selectedCustomerTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },

  // Selected Customer Content
  selectedCustomerContent: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
  },

  // Main Info Layout
  selectedCustomerMainInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
  },

  // Avatar
  selectedCustomerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.lg,
    ...SHADOWS.medium,
  },

  selectedCustomerAvatarText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.surface,
    fontWeight: "700",
  },

  // Details Container
  selectedCustomerDetailsContainer: {
    flex: 1,
    paddingTop: SPACING.xs,
  },

  selectedCustomerName: {
    ...TYPOGRAPHY.h3,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },

  // Contact Info
  selectedCustomerContactInfo: {
    marginTop: SPACING.sm,
  },

  selectedCustomerContactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },

  selectedCustomerContactText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },

  // Booking Statistics
  selectedCustomerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  selectedCustomerStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },

  selectedCustomerStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },

  selectedCustomerStatContent: {
    flex: 1,
  },

  selectedCustomerStatValue: {
    ...TYPOGRAPHY.h3,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },

  selectedCustomerStatLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
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
