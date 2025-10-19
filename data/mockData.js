// Initial empty data for fresh start
export const mockCustomers = [];
export const mockBookings = [];

// Helper function to get today's date in YYYY-MM-DD format
export const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};
