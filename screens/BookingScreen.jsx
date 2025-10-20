// screens/BookingScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

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
  } = useApp();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
      console.error('Logout error:', error);
    }
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(timeString);
    }
    return slots;
  }, []);

  const getTimeSlotStatus = (timeSlot) => {
    const isBooked = isTimeSlotBooked(timeSlot, selectedDate);
    const isCancelled = isTimeSlotCancelled(timeSlot, selectedDate);
    const isSelected = selectedTimeSlots.includes(timeSlot);
    const isCompleted = getBookingForTimeSlot(timeSlot, selectedDate)?.status === 'completed';

    if (isCompleted) return 'completed';
    if (isCancelled) return 'cancelled';
    if (isBooked) return 'booked';
    if (isSelected) return 'selected';
    return 'available';
  };

  const handleTimeSlotPress = (timeSlot) => {
    if (isOffline || isUsingCache) {
      Alert.alert(
        'Offline Mode',
        'This action requires an internet connection.',
        [{ text: 'OK' }]
      );
      return;
    }

    const status = getTimeSlotStatus(timeSlot);
    
    if (status === 'booked' || status === 'completed') {
      return; // Can't select booked or completed slots
    }

    if (status === 'cancelled') {
      // Re-book cancelled slot
      setSelectedTimeSlots(prev => [...prev, timeSlot]);
    } else if (status === 'selected') {
      // Deselect slot
      setSelectedTimeSlots(prev => prev.filter(slot => slot !== timeSlot));
    } else {
      // Select available slot
      setSelectedTimeSlots(prev => [...prev, timeSlot]);
    }
  };

  const handleLongPress = (timeSlot) => {
    if (isOffline || isUsingCache) {
      Alert.alert(
        'Offline Mode',
        'This action requires an internet connection.',
        [{ text: 'OK' }]
      );
      return;
    }

    const status = getTimeSlotStatus(timeSlot);
    
    if (status === 'booked') {
      Alert.alert(
        'Cancel Booking',
        'Are you sure you want to cancel this booking?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', onPress: () => cancelTimeSlot(timeSlot) }
        ]
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
          .from('bookings')
          .update({ 
            cancelled_slots: updatedCancelledSlots,
            status: updatedCancelledSlots.length > 0 ? 'cancelled' : 'confirmed'
          })
          .eq('id', booking.id);
        
        if (error) throw error;
        
        Alert.alert('Success', 'Booking cancelled successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToBook = () => {
    if (isOffline || isUsingCache) {
      Alert.alert(
        'Offline Mode',
        'This action requires an internet connection.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (selectedTimeSlots.length === 0) {
      Alert.alert('No Selection', 'Please select at least one time slot');
      return;
    }

    navigation.navigate('Confirmation', {
      selectedDate,
      selectedTimeSlots,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return '#4CAF50';
      case 'cancelled': return '#FF9800';
      case 'completed': return '#9E9E9E';
      case 'selected': return '#2196F3';
      default: return '#E0E0E0';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'booked': return 'Booked';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      case 'selected': return 'Selected';
      default: return 'Available';
    }
  };

  const todayBookings = getTodayBookings();
  const todayBookedSlots = todayBookings.reduce((acc, booking) => {
    return acc + booking.timeSlots.filter(slot => !booking.cancelledSlots.includes(slot)).length;
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
          <TouchableOpacity style={styles.dateButton}>
            <Text style={styles.dateText}>{selectedDate}</Text>
          </TouchableOpacity>
        </View>

        {/* Time Slots Grid */}
        <View style={styles.timeSlotsContainer}>
          <Text style={styles.timeSlotsTitle}>Available Time Slots</Text>
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((timeSlot) => {
              const status = getTimeSlotStatus(timeSlot);
              const isDisabled = isOffline || isUsingCache || isProcessing;
              
              return (
                <TouchableOpacity
                  key={timeSlot}
                  style={[
                    styles.timeSlot,
                    { backgroundColor: getStatusColor(status) },
                    isDisabled && styles.disabledSlot
                  ]}
                  onPress={() => handleTimeSlotPress(timeSlot)}
                  onLongPress={() => handleLongPress(timeSlot)}
                  disabled={isDisabled}
                >
                  <Text style={styles.timeSlotText}>{timeSlot}</Text>
                  <Text style={styles.statusText}>{getStatusText(status)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Proceed Button */}
        <TouchableOpacity
          style={[
            styles.proceedButton,
            (isOffline || isUsingCache || selectedTimeSlots.length === 0) && styles.disabledButton
          ]}
          onPress={handleProceedToBook}
          disabled={isOffline || isUsingCache || selectedTimeSlots.length === 0}
        >
          <Text style={styles.proceedButtonText}>
            {isOffline || isUsingCache 
              ? 'Offline Mode - Actions Disabled'
              : `Proceed to Book (${selectedTimeSlots.length} slots)`
            }
          </Text>
        </TouchableOpacity>
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
  statsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  dateContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  timeSlotsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledSlot: {
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
  },
  proceedButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});