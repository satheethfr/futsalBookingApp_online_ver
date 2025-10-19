# FutsalPro - Futsal Booking Management App

A modern React Native application for managing futsal court bookings and customers.

## Features

### 🏟️ Booking Management

- **Interactive Calendar**: Horizontal scrollable calendar with date selection
- **Time Slot Filters**: Filter by time periods (All, Early Bird, Day Shift, Prime Time)
- **24-Hour Time Grid**: View all available time slots in a single view
- **Real-time Availability**: See which slots are available, selected, or booked
- **Today's Stats**: Dashboard showing today's booked slots count

### 👥 Customer Management

- **Customer Directory**: Searchable list of all customers
- **Customer Profiles**: Detailed customer information with booking history
- **Add New Customers**: Quick customer registration with validation
- **Edit Customer Details**: Update customer information
- **Booking Statistics**: Track total bookings and cancellations per customer

### 📱 Modern UI/UX

- **Clean Design**: Minimalist, modern interface
- **Responsive Layout**: Optimized for mobile devices
- **Intuitive Navigation**: Tab and stack navigation
- **Real-time Feedback**: Toast notifications for user actions
- **Data Persistence**: Local storage using AsyncStorage

## Tech Stack

- **React Native** with Expo
- **React Navigation** (Stack & Tab navigators)
- **React Context API** for state management
- **AsyncStorage** for data persistence
- **React Native Calendars** for calendar functionality
- **React Native Toast Message** for notifications
- **Expo Vector Icons** for icons

## Project Structure

```
futsal-booking-app/
├── App.jsx                 # Main app entry point with navigation
├── package.json            # Dependencies and scripts
├── app.json               # Expo configuration
├── context/
│   └── AppContext.jsx     # Global state management
├── data/
│   └── mockData.js        # Initial mock data
└── screens/
    ├── BookingScreen.jsx      # Main booking interface
    ├── ConfirmationScreen.jsx # Customer selection & booking confirmation
    ├── CustomersScreen.jsx    # Customer directory
    └── ProfileScreen.jsx      # Individual customer profiles
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Expo CLI
- Android Studio (for Android development)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd futsal-booking-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Run on Android**
   ```bash
   npm run android
   ```

## Usage

### Booking a Court

1. Open the app and navigate to the "Book Court" tab
2. Select a date from the calendar
3. Choose time slots from the 24-hour grid
4. Use filters to narrow down available slots
5. Tap "Proceed to Book" to continue
6. Search for an existing customer or add a new one
7. Confirm the booking

### Managing Customers

1. Navigate to the "Customers" tab
2. Search for customers by name, mobile, or city
3. Tap on a customer to view their profile
4. Edit customer details or view booking history
5. Cancel upcoming bookings if needed

## Key Features Explained

### State Management

The app uses React Context API for global state management, providing:

- Customer data management (CRUD operations)
- Booking management (create, cancel, retrieve)
- Data persistence with AsyncStorage
- Real-time updates across all screens

### Navigation Structure

- **Tab Navigator**: Main navigation between Booking and Customers
- **Stack Navigator**: Handles modal screens (Confirmation) and detail screens (Profile)
- **Deep Linking**: Support for navigation with parameters

### Data Persistence

- All data is stored locally using AsyncStorage
- Data persists between app sessions
- Automatic data loading on app startup
- Real-time data synchronization

## Customization

### Styling

The app uses a consistent design system with:

- Primary color: #007AFF (iOS Blue)
- Success color: #28a745 (Green)
- Error color: #dc3545 (Red)
- Background: #f8f9fa (Light Gray)
- Text: #2d4150 (Dark Gray)

### Adding New Features

1. **New Screens**: Add to the Stack Navigator in App.jsx
2. **New State**: Extend the AppContext reducer
3. **New Data**: Add to mockData.js and update context functions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
