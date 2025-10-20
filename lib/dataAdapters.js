// lib/dataAdapters.js
// Transform between Supabase snake_case and app camelCase

export const transformCustomerFromDB = (dbCustomer) => ({
    id: dbCustomer.id,
    name: dbCustomer.name,
    mobile: dbCustomer.mobile,
    city: dbCustomer.city,
    totalBookings: dbCustomer.total_bookings,
    totalCancellations: dbCustomer.total_cancellations,
    createdAt: dbCustomer.created_at,
    updatedAt: dbCustomer.updated_at,
  });
  
  export const transformCustomerToDB = (appCustomer) => ({
    name: appCustomer.name,
    mobile: appCustomer.mobile,
    city: appCustomer.city,
    total_bookings: appCustomer.totalBookings || 0,
    total_cancellations: appCustomer.totalCancellations || 0,
  });
  
  export const transformBookingFromDB = (dbBooking) => ({
    id: dbBooking.id,
    customerId: dbBooking.customer_id,
    customerName: dbBooking.customer_name,
    date: dbBooking.date,
    timeSlots: dbBooking.time_slots || [],
    cancelledSlots: dbBooking.cancelled_slots || [],
    status: dbBooking.status,
    createdAt: dbBooking.created_at,
    updatedAt: dbBooking.updated_at,
  });
  
  export const transformBookingToDB = (appBooking) => ({
    customer_id: appBooking.customerId,
    customer_name: appBooking.customerName,
    date: appBooking.date,
    time_slots: appBooking.timeSlots,
    cancelled_slots: appBooking.cancelledSlots || [],
    status: appBooking.status || 'confirmed',
  });