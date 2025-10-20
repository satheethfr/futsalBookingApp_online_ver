// lib/errorHandler.js
import Toast from 'react-native-toast-message';

export const handleError = (error) => {
  console.error('Error:', error);
  
  // Network errors
  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
    Toast.show({
      type: 'error',
      text1: 'Network Error',
      text2: 'Please check your internet connection.',
      position: 'bottom'
    });
    return 'network';
  }
  
  // Auth errors
  if (error.message?.includes('JWT') || error.status === 401) {
    Toast.show({
      type: 'error',
      text1: 'Session Expired',
      text2: 'Please log in again.',
      position: 'bottom'
    });
    return 'auth';
  }
  
  // Server errors
  if (error.status >= 500) {
    Toast.show({
      type: 'error',
      text1: 'Server Error',
      text2: 'Please try again later.',
      position: 'bottom'
    });
    return 'server';
  }
  
  // Generic error
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: error.message || 'An unexpected error occurred.',
    position: 'bottom'
  });
  return 'generic';
};