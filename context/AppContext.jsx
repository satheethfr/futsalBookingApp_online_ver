import React, { createContext, useContext, useReducer, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Initial state
const initialState = {
  customers: [],
  bookings: [],
  loading: true,
  error: null,
};

// Action types
const ActionTypes = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  LOAD_DATA: "LOAD_DATA",
  ADD_CUSTOMER: "ADD_CUSTOMER",
  UPDATE_CUSTOMER: "UPDATE_CUSTOMER",
  DELETE_CUSTOMER: "DELETE_CUSTOMER",
  ADD_BOOKING: "ADD_BOOKING",
  CANCEL_BOOKING: "CANCEL_BOOKING",
  CANCEL_ENTIRE_BOOKING: "CANCEL_ENTIRE_BOOKING",
  COMPLETE_BOOKING: "COMPLETE_BOOKING",
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ActionTypes.LOAD_DATA:
      return {
        ...state,
        customers: action.payload.customers,
        bookings: action.payload.bookings,
        loading: false,
        error: null,
      };

    case ActionTypes.ADD_CUSTOMER:
      const newCustomer = {
        ...action.payload,
        id: Date.now().toString(),
        totalBookings: 0,
        totalCancellations: 0,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        customers: [...state.customers, newCustomer],
      };

    case ActionTypes.UPDATE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.map((customer) =>
          customer.id === action.payload.id
            ? { ...customer, ...action.payload.updates }
            : customer
        ),
      };

    case ActionTypes.DELETE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.filter(
          (customer) => customer.id !== action.payload
        ),
        bookings: state.bookings.filter(
          (booking) => booking.customerId !== action.payload
        ),
      };

    case ActionTypes.ADD_BOOKING:
      const newBooking = {
        ...action.payload,
        id: Date.now().toString(),
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };

      // Update customer's total bookings
      const updatedCustomers = state.customers.map((customer) =>
        customer.id === action.payload.customerId
          ? { ...customer, totalBookings: customer.totalBookings + 1 }
          : customer
      );

      return {
        ...state,
        bookings: [...state.bookings, newBooking],
        customers: updatedCustomers,
      };

    case ActionTypes.CANCEL_BOOKING:
      const { bookingId: cancelBookingId, timeSlot: cancelTimeSlot } =
        action.payload;

      const updatedBookings = state.bookings.map((booking) => {
        if (booking.id === cancelBookingId) {
          // Remove the specific time slot from active slots
          const updatedTimeSlots = booking.timeSlots.filter(
            (slot) => slot !== cancelTimeSlot
          );
          // Add to cancelled slots
          const cancelledSlots = booking.cancelledSlots || [];
          const updatedCancelledSlots = [...cancelledSlots, cancelTimeSlot];

          // If no time slots left, mark booking as cancelled
          if (updatedTimeSlots.length === 0) {
            return {
              ...booking,
              status: "cancelled",
              timeSlots: [],
              cancelledSlots: updatedCancelledSlots,
            };
          }
          // Otherwise, just move the time slot to cancelled
          return {
            ...booking,
            timeSlots: updatedTimeSlots,
            cancelledSlots: updatedCancelledSlots,
          };
        }
        return booking;
      });

      // Find the cancelled booking to update customer's cancellation count
      const cancelledBooking = updatedBookings.find(
        (booking) => booking.id === cancelBookingId
      );

      // Update customer's cancellation count
      const customersWithUpdatedCancellations = state.customers.map(
        (customer) =>
          customer.id === cancelledBooking?.customerId
            ? {
                ...customer,
                totalCancellations: customer.totalCancellations + 1,
              }
            : customer
      );

      return {
        ...state,
        bookings: updatedBookings,
        customers: customersWithUpdatedCancellations,
      };

    case ActionTypes.COMPLETE_BOOKING:
      const { bookingId, timeSlot } = action.payload;
      const completedBookings = state.bookings.map((booking) => {
        if (booking.id === bookingId) {
          // Remove the time slot from active slots
          const updatedTimeSlots = booking.timeSlots.filter(
            (slot) => slot !== timeSlot
          );
          // Add to completed slots
          const completedSlots = booking.completedSlots || [];
          const updatedCompletedSlots = [...completedSlots, timeSlot];

          // If no time slots left, mark booking as completed
          if (updatedTimeSlots.length === 0) {
            return {
              ...booking,
              status: "completed",
              timeSlots: [],
              completedSlots: updatedCompletedSlots,
            };
          }
          // Otherwise, just move the time slot to completed
          return {
            ...booking,
            timeSlots: updatedTimeSlots,
            completedSlots: updatedCompletedSlots,
          };
        }
        return booking;
      });

      return {
        ...state,
        bookings: completedBookings,
      };

    case ActionTypes.CANCEL_ENTIRE_BOOKING:
      const entireBookingId = action.payload;
      const cancelledEntireBooking = state.bookings.find(
        (b) => b.id === entireBookingId
      );
      const updatedEntireBookings = state.bookings.map((booking) =>
        booking.id === entireBookingId
          ? { ...booking, status: "cancelled" }
          : booking
      );

      // Update customer's cancellation count
      const customersWithEntireCancellations = state.customers.map((customer) =>
        customer.id === cancelledEntireBooking?.customerId
          ? {
              ...customer,
              totalCancellations: customer.totalCancellations + 1,
            }
          : customer
      );

      return {
        ...state,
        bookings: updatedEntireBookings,
        customers: customersWithEntireCancellations,
      };

    case "CLEANUP_BOOKINGS":
      return {
        ...state,
        bookings: action.payload.bookings,
      };

    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from AsyncStorage on app start
  useEffect(() => {
    try {
      loadData();
    } catch (error) {
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: "Failed to load app data",
      });
    }
  }, []);

  // Save data to AsyncStorage whenever state changes
  useEffect(() => {
    if (!state.loading) {
      try {
        saveData();
      } catch (error) {
        // Silent fail for save operations
      }
    }
  }, [state.customers, state.bookings]);

  const loadData = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      const [customersData, bookingsData] = await Promise.all([
        AsyncStorage.getItem("customers"),
        AsyncStorage.getItem("bookings"),
      ]);

      const customers = customersData ? JSON.parse(customersData) : [];
      const bookings = bookingsData ? JSON.parse(bookingsData) : [];

      dispatch({
        type: ActionTypes.LOAD_DATA,
        payload: { customers, bookings },
      });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem("customers", JSON.stringify(state.customers)),
        AsyncStorage.setItem("bookings", JSON.stringify(state.bookings)),
      ]);
    } catch (error) {
      // Silent fail for save operations
    }
  };

  // Action creators
  const addCustomer = (customerData) => {
    dispatch({
      type: ActionTypes.ADD_CUSTOMER,
      payload: customerData,
    });
  };

  const updateCustomer = (customerId, updates) => {
    dispatch({
      type: ActionTypes.UPDATE_CUSTOMER,
      payload: { id: customerId, updates },
    });
  };

  const deleteCustomer = (customerId) => {
    dispatch({
      type: ActionTypes.DELETE_CUSTOMER,
      payload: customerId,
    });
  };

  const addBooking = (bookingData) => {
    dispatch({
      type: ActionTypes.ADD_BOOKING,
      payload: bookingData,
    });
  };

  const cancelBooking = (bookingId, timeSlot) => {
    dispatch({
      type: ActionTypes.CANCEL_BOOKING,
      payload: { bookingId, timeSlot },
    });
  };

  const cancelEntireBooking = (bookingId) => {
    dispatch({
      type: ActionTypes.CANCEL_ENTIRE_BOOKING,
      payload: bookingId,
    });
  };

  const completeBooking = (bookingId, timeSlot) => {
    dispatch({
      type: ActionTypes.COMPLETE_BOOKING,
      payload: { bookingId, timeSlot },
    });
  };

  // Helper functions
  const getCustomerById = (id) => {
    return state.customers.find((customer) => customer.id === id);
  };

  const getBookingsByCustomerId = (customerId) => {
    return state.bookings.filter(
      (booking) => booking.customerId === customerId
    );
  };

  const getBookingsForDate = (date) => {
    return state.bookings.filter(
      (booking) => booking.date === date && booking.status === "confirmed"
    );
  };

  const isTimeSlotBooked = (date, timeSlot) => {
    const dayBookings = getBookingsForDate(date);
    console.log(`🔍 isTimeSlotBooked: Checking ${timeSlot} on ${date}`);
    console.log(`🔍 Day bookings:`, dayBookings);

    // Check if there are any active (non-cancelled) bookings for this time slot
    const activeBookings = dayBookings.filter((booking) => {
      const hasTimeSlot = booking.timeSlots.includes(timeSlot);
      const isCancelled =
        booking.cancelledSlots && booking.cancelledSlots.includes(timeSlot);

      console.log(
        `🔍 Booking ${
          booking.id
        }: hasTimeSlot=${hasTimeSlot}, isCancelled=${isCancelled}, timeSlots=[${booking.timeSlots.join(
          ","
        )}], cancelledSlots=[${
          booking.cancelledSlots ? booking.cancelledSlots.join(",") : "none"
        }]`
      );

      return hasTimeSlot && !isCancelled;
    });

    const result = activeBookings.length > 0;
    console.log(`🔍 Active bookings for ${timeSlot}: ${activeBookings.length}`);
    console.log(`🔍 isTimeSlotBooked result: ${result}`);
    return result;
  };

  // Clean up duplicate test bookings
  const cleanupTestBookings = () => {
    console.log("🧹 CLEANING UP DUPLICATE TEST BOOKINGS");

    // Find all bookings for test date 2025-11-15 with time slot 14:00
    const testBookings = state.bookings.filter(
      (booking) =>
        booking.date === "2025-11-15" && booking.timeSlots.includes("14:00")
    );

    console.log(`🧹 Found ${testBookings.length} test bookings to clean up`);

    if (testBookings.length > 1) {
      // Keep only the first booking, remove the rest
      const bookingsToKeep = testBookings.slice(0, 1);
      const bookingsToRemove = testBookings.slice(1);

      console.log(
        `🧹 Keeping 1 booking, removing ${bookingsToRemove.length} duplicates`
      );

      const updatedBookings = state.bookings.filter(
        (booking) =>
          !bookingsToRemove.some(
            (removeBooking) => removeBooking.id === booking.id
          )
      );

      dispatch({
        type: "CLEANUP_BOOKINGS",
        payload: { bookings: updatedBookings },
      });
    }
  };

  const getUpcomingBookings = (customerId) => {
    const today = new Date().toISOString().split("T")[0];
    return getBookingsByCustomerId(customerId).filter(
      (booking) => booking.date >= today && booking.status === "confirmed"
    );
  };

  const getPastBookings = (customerId) => {
    const today = new Date().toISOString().split("T")[0];
    return getBookingsByCustomerId(customerId).filter(
      (booking) =>
        booking.date < today ||
        booking.status === "completed" ||
        booking.status === "cancelled"
    );
  };

  const value = {
    // State
    customers: state.customers,
    bookings: state.bookings,
    loading: state.loading,
    error: state.error,

    // Actions
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addBooking,
    cancelBooking,
    cancelEntireBooking,
    completeBooking,

    // Helpers
    getCustomerById,
    getBookingsByCustomerId,
    getBookingsForDate,
    isTimeSlotBooked,
    getUpcomingBookings,
    getPastBookings,
    cleanupTestBookings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
