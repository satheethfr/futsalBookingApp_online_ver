// components/OfflineBanner.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export default function OfflineBanner() {
  const { isOffline, isUsingCache, isReconnecting } = useApp();
  
  if (!isOffline && !isReconnecting) return null;
  
  return (
    <View style={[styles.banner, isOffline && styles.offline]}>
      <Text style={styles.text}>
        {isOffline 
          ? '⚠️ You are offline' + (isUsingCache ? ' - Viewing cached data' : '')
          : '🔄 Reconnecting...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offline: {
    backgroundColor: '#ff6b6b',
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});