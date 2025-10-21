// context/AppContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "../lib/supabase";
import { handleError } from "../lib/errorHandler";
import {
  transformCustomerFromDB,
  transformCustomerToDB,
  transformBookingFromDB,
  transformBookingToDB,
} from "../lib/dataAdapters";
import Toast from "react-native-toast-message";

const AppContext = createContext();

const initialState = {
  customers: [],
  bookings: [],
  isLoading: true,
  isOffline: false,
  isReconnecting: false,
  isUsingCache: false,
  user: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case "LOAD_DATA":
      return {
        ...state,
        customers: action.payload.customers,
        bookings: action.payload.bookings,
        isLoading: false,
        isUsingCache: false,
      };
    case "LOAD_CACHED_DATA":
      return {
        ...state,
        customers: action.payload.customers,
        bookings: action.payload.bookings,
        isLoading: false,
        isUsingCache: true,
      };
    case "SET_NETWORK_STATUS":
      return {
        ...state,
        isOffline: action.payload,
      };
    case "SET_RECONNECTING":
      return {
        ...state,
        isReconnecting: action.payload,
      };
    case "REALTIME_BOOKING_ADDED":
      return {
        ...state,
        bookings: [...state.bookings, action.payload],
      };
    case "REALTIME_BOOKING_UPDATED":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.payload.id ? action.payload : booking
        ),
      };
    case "REALTIME_BOOKING_DELETED":
      return {
        ...state,
        bookings: state.bookings.filter(
          (booking) => booking.id !== action.payload
        ),
      };
    case "REALTIME_CUSTOMER_ADDED":
      return {
        ...state,
        customers: [...state.customers, action.payload],
      };
    case "REALTIME_CUSTOMER_UPDATED":
      return {
        ...state,
        customers: state.customers.map((customer) =>
          customer.id === action.payload.id ? action.payload : customer
        ),
      };
    case "REALTIME_CUSTOMER_DELETED":
      return {
        ...state,
        customers: state.customers.filter(
          (customer) => customer.id !== action.payload
        ),
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Network state management
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      dispatch({
        type: "SET_NETWORK_STATUS",
        payload: !state.isConnected,
      });
    });
    return () => unsubscribe();
  }, []);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    // Subscribe to bookings table
    const bookingsSubscription = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          console.log("Bookings change:", payload);
          if (payload.eventType === "INSERT") {
            const booking = transformBookingFromDB(payload.new);
            dispatch({ type: "REALTIME_BOOKING_ADDED", payload: booking });
          } else if (payload.eventType === "UPDATE") {
            const booking = transformBookingFromDB(payload.new);
            dispatch({ type: "REALTIME_BOOKING_UPDATED", payload: booking });
          } else if (payload.eventType === "DELETE") {
            dispatch({
              type: "REALTIME_BOOKING_DELETED",
              payload: payload.old.id,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          dispatch({ type: "SET_RECONNECTING", payload: false });
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          dispatch({ type: "SET_RECONNECTING", payload: true });
        }
      });

    // Subscribe to customers table
    const customersSubscription = supabase
      .channel("customers-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        (payload) => {
          console.log("Customers change:", payload);
          if (payload.eventType === "INSERT") {
            const customer = transformCustomerFromDB(payload.new);
            dispatch({ type: "REALTIME_CUSTOMER_ADDED", payload: customer });
          } else if (payload.eventType === "UPDATE") {
            const customer = transformCustomerFromDB(payload.new);
            dispatch({ type: "REALTIME_CUSTOMER_UPDATED", payload: customer });
          } else if (payload.eventType === "DELETE") {
            dispatch({
              type: "REALTIME_CUSTOMER_DELETED",
              payload: payload.old.id,
            });
          }
        }
      )
      .subscribe();

    return () => {
      bookingsSubscription.unsubscribe();
      customersSubscription.unsubscribe();
    };
  }, []);

  const loadData = async () => {
    try {
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .order("date", { ascending: true });

      if (customersError || bookingsError)
        throw customersError || bookingsError;

      // Transform snake_case to camelCase
      const transformedCustomers = customers.map(transformCustomerFromDB);
      const transformedBookings = bookings.map(transformBookingFromDB);

      // Cache for offline use
      await AsyncStorage.setItem(
        "cache_customers",
        JSON.stringify(transformedCustomers)
      );
      await AsyncStorage.setItem(
        "cache_bookings",
        JSON.stringify(transformedBookings)
      );

      dispatch({
        type: "LOAD_DATA",
        payload: {
          customers: transformedCustomers,
          bookings: transformedBookings,
        },
      });
    } catch (error) {
      // Try loading from cache if network fails
      try {
        const cachedCustomers = await AsyncStorage.getItem("cache_customers");
        const cachedBookings = await AsyncStorage.getItem("cache_bookings");
        if (cachedCustomers && cachedBookings) {
          dispatch({
            type: "LOAD_CACHED_DATA",
            payload: {
              customers: JSON.parse(cachedCustomers),
              bookings: JSON.parse(cachedBookings),
            },
          });
        }
      } catch (cacheError) {
        console.error("Cache error:", cacheError);
      }
      handleError(error);
    }
  };

  const addCustomer = async (customerData) => {
    if (state.isOffline || state.isUsingCache) {
      Toast.show({
        type: "error",
        text1: "Offline Mode",
        text2: "This action requires an internet connection.",
        position: "bottom",
      });
      return { success: false, error: "offline" };
    }

    try {
      const dbCustomer = transformCustomerToDB(customerData);
      const { data, error } = await supabase
        .from("customers")
        .insert([dbCustomer])
        .select()
        .single();

      if (error) throw error;

      Toast.show({ type: "success", text1: "Customer added successfully" });
      return { success: true, data };
    } catch (error) {
      handleError(error);
      return { success: false, error };
    }
  };

  const updateCustomer = async (customerId, updates) => {
    if (state.isOffline || state.isUsingCache) {
      Toast.show({
        type: "error",
        text1: "Offline Mode",
        text2: "This action requires an internet connection.",
        position: "bottom",
      });
      return { success: false, error: "offline" };
    }

    try {
      const dbUpdates = transformCustomerToDB(updates);
      const { data, error } = await supabase
        .from("customers")
        .update(dbUpdates)
        .eq("id", customerId)
        .select()
        .single();

      if (error) throw error;

      Toast.show({ type: "success", text1: "Customer updated successfully" });
      return { success: true, data };
    } catch (error) {
      handleError(error);
      return { success: false, error };
    }
  };

  const deleteCustomer = async (customerId) => {
    if (state.isOffline || state.isUsingCache) {
      Toast.show({
        type: "error",
        text1: "Offline Mode",
        text2: "This action requires an internet connection.",
        position: "bottom",
      });
      return { success: false, error: "offline" };
    }

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);

      if (error) throw error;

      Toast.show({ type: "success", text1: "Customer deleted successfully" });
      return { success: true };
    } catch (error) {
      handleError(error);
      return { success: false, error };
    }
  };

  const addBooking = async (bookingData) => {
    if (state.isOffline || state.isUsingCache) {
      Toast.show({
        type: "error",
        text1: "Offline Mode",
        text2: "This action requires an internet connection.",
        position: "bottom",
      });
      return { success: false, error: "offline" };
    }

    try {
      const dbBooking = transformBookingToDB(bookingData);
      const { data, error } = await supabase
        .from("bookings")
        .insert([dbBooking])
        .select()
        .single();

      if (error) throw error;

      // Update customer booking count
      await updateCustomerBookingCount(bookingData.customerId, 1);

      // Force refresh of data to update UI
      await loadData();

      Toast.show({ type: "success", text1: "Booking created successfully" });
      return { success: true, data };
    } catch (error) {
      handleError(error);
      return { success: false, error };
    }
  };

  const cancelBooking = async (bookingId, cancelledSlots) => {
    if (state.isOffline || state.isUsingCache) {
      Toast.show({
        type: "error",
        text1: "Offline Mode",
        text2: "This action requires an internet connection.",
        position: "bottom",
      });
      return { success: false, error: "offline" };
    }

    try {
      // Get the booking first to get customer ID
      const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select("customer_id, time_slots")
        .eq("id", bookingId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("bookings")
        .update({
          cancelled_slots: cancelledSlots,
          status: cancelledSlots.length > 0 ? "cancelled" : "confirmed",
        })
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;

      // Update customer statistics
      if (cancelledSlots.length > 0) {
        // Decrease booking count and increase cancellation count
        await updateCustomerBookingCount(booking.customer_id, -1);
        await updateCustomerCancellationCount(booking.customer_id, 1);
      }

      Toast.show({ type: "success", text1: "Booking cancelled successfully" });
      return { success: true, data };
    } catch (error) {
      handleError(error);
      return { success: false, error };
    }
  };

  const completeBooking = async (bookingId) => {
    if (state.isOffline || state.isUsingCache) {
      Toast.show({
        type: "error",
        text1: "Offline Mode",
        text2: "This action requires an internet connection.",
        position: "bottom",
      });
      return { success: false, error: "offline" };
    }

    try {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;

      Toast.show({ type: "success", text1: "Booking completed successfully" });
      return { success: true, data };
    } catch (error) {
      handleError(error);
      return { success: false, error };
    }
  };

  // Helper functions (keep existing logic)
  const isTimeSlotBooked = (timeSlot, date) => {
    const dayBookings = state.bookings.filter(
      (booking) => booking.date === date && booking.status === "confirmed"
    );

    return dayBookings.some(
      (booking) =>
        booking.timeSlots.includes(timeSlot) &&
        !booking.cancelledSlots.includes(timeSlot)
    );
  };

  const isTimeSlotCancelled = (timeSlot, date) => {
    const dayBookings = state.bookings.filter(
      (booking) => booking.date === date && booking.status === "confirmed"
    );

    return dayBookings.some(
      (booking) =>
        booking.timeSlots.includes(timeSlot) &&
        booking.cancelledSlots.includes(timeSlot)
    );
  };

  const getBookingForTimeSlot = (timeSlot, date) => {
    const dayBookings = state.bookings.filter(
      (booking) => booking.date === date && booking.status === "confirmed"
    );

    return dayBookings.find((booking) => booking.timeSlots.includes(timeSlot));
  };

  const getUpcomingBookings = (customerId) => {
    const today = new Date().toISOString().split("T")[0];
    return state.bookings.filter(
      (booking) =>
        booking.customerId === customerId &&
        booking.date >= today &&
        booking.status === "confirmed"
    );
  };

  const getPastBookings = (customerId) => {
    const today = new Date().toISOString().split("T")[0];
    return state.bookings.filter(
      (booking) => booking.customerId === customerId && booking.date < today
    );
  };

  const getCancelledBookings = (customerId) => {
    return state.bookings.filter(
      (booking) =>
        booking.customerId === customerId && booking.status === "cancelled"
    );
  };

  const getCurrentBookings = (customerId) => {
    const today = new Date().toISOString().split("T")[0];
    return state.bookings.filter(
      (booking) =>
        booking.customerId === customerId &&
        booking.date >= today &&
        booking.status === "confirmed"
    );
  };

  const getTodayBookings = () => {
    const today = new Date().toISOString().split("T")[0];
    return state.bookings.filter(
      (booking) => booking.date === today && booking.status === "confirmed"
    );
  };

  // Helper functions for updating customer statistics
  const updateCustomerBookingCount = async (customerId, increment) => {
    try {
      const { data: customer, error: fetchError } = await supabase
        .from("customers")
        .select("total_bookings")
        .eq("id", customerId)
        .single();

      if (fetchError) throw fetchError;

      const newCount = Math.max(0, (customer.total_bookings || 0) + increment);

      const { error: updateError } = await supabase
        .from("customers")
        .update({ total_bookings: newCount })
        .eq("id", customerId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error updating customer booking count:", error);
    }
  };

  const updateCustomerCancellationCount = async (customerId, increment) => {
    try {
      const { data: customer, error: fetchError } = await supabase
        .from("customers")
        .select("total_cancellations")
        .eq("id", customerId)
        .single();

      if (fetchError) throw fetchError;

      const newCount = Math.max(
        0,
        (customer.total_cancellations || 0) + increment
      );

      const { error: updateError } = await supabase
        .from("customers")
        .update({ total_cancellations: newCount })
        .eq("id", customerId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error updating customer cancellation count:", error);
    }
  };

  const value = {
    ...state,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addBooking,
    cancelBooking,
    completeBooking,
    isTimeSlotBooked,
    isTimeSlotCancelled,
    getBookingForTimeSlot,
    getUpcomingBookings,
    getPastBookings,
    getCancelledBookings,
    getCurrentBookings,
    getTodayBookings,
    loadData,
    updateCustomerBookingCount,
    updateCustomerCancellationCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
