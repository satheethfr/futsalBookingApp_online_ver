// screens/CustomersScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function CustomersScreen({ navigation }) {
  const {
    customers,
    isLoading,
    isOffline,
    isUsingCache,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.mobile.includes(searchQuery) ||
    customer.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustomer = () => {
    if (isOffline || isUsingCache) {
      Alert.alert(
        'Offline Mode',
        'This action requires an internet connection.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.prompt(
      'Add New Customer',
      'Enter customer name:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: (name) => {
          if (name) {
            Alert.prompt(
              'Mobile Number',
              'Enter mobile number:',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Add', onPress: (mobile) => {
                  if (mobile) {
                    Alert.prompt(
                      'City',
                      'Enter city:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Add', onPress: async (city) => {
                          if (city) {
                            setIsProcessing(true);
                            try {
                              await addCustomer({ name, mobile, city });
                            } catch (error) {
                              Alert.alert('Error', 'Failed to add customer');
                            } finally {
                              setIsProcessing(false);
                            }
                          }
                        }}
                      ]
                    );
                  }
                }}
              ]
            );
          }
        }}
      ]
    );
  };

  const handleDeleteCustomer = (customer) => {
    if (isOffline || isUsingCache) {
      Alert.alert(
        'Offline Mode',
        'This action requires an internet connection.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          setIsProcessing(true);
          try {
            await deleteCustomer(customer.id);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete customer');
          } finally {
            setIsProcessing(false);
          }
        }}
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading customers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="people" size={24} color="#007AFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Customers</Text>
              <Text style={styles.headerSubtitle}>{customers.length} total customers</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Add Customer Button */}
        <TouchableOpacity
          style={[
            styles.addButton,
            (isOffline || isUsingCache) && styles.disabledButton
          ]}
          onPress={handleAddCustomer}
          disabled={isOffline || isUsingCache}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>
            {isOffline || isUsingCache ? 'Offline Mode - Actions Disabled' : 'Add Customer'}
          </Text>
        </TouchableOpacity>

        {/* Customers List */}
        <View style={styles.customersList}>
          {filteredCustomers.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              style={styles.customerItem}
              onPress={() => navigation.navigate('Profile', { customerId: customer.id })}
            >
              <View style={styles.customerAvatar}>
                <Text style={styles.customerAvatarText}>
                  {customer.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerMobile}>{customer.mobile}</Text>
                <Text style={styles.customerCity}>{customer.city}</Text>
              </View>

              <View style={styles.customerStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{customer.totalBookings}</Text>
                  <Text style={styles.statLabel}>BOOKINGS</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{customer.totalCancellations}</Text>
                  <Text style={styles.statLabel}>CANCELLED</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteCustomer(customer)}
                disabled={isOffline || isUsingCache}
              >
                <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {filteredCustomers.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No customers found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first customer'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  customersList: {
    marginBottom: 20,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  customerAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customerMobile: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  customerCity: {
    fontSize: 14,
    color: '#666',
  },
  customerStats: {
    flexDirection: 'row',
    marginRight: 15,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});