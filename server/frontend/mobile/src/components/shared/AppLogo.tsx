import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  showText?: boolean;
  variant?: 'primary' | 'secondary' | 'minimal';
}

export default function AppLogo({ 
  size = 'medium', 
  showText = true, 
  variant = 'primary' 
}: AppLogoProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 32, height: 32 },
          outerCircle: { width: 32, height: 32, borderRadius: 16 },
          innerCircle: { width: 24, height: 24, borderRadius: 12 },
          calendar: { width: 20, height: 14, borderRadius: 2 },
          clock: { width: 8, height: 8, borderRadius: 4 },
          checkmark: { fontSize: 8 },
          text: { fontSize: 10 }
        };
      case 'large':
        return {
          container: { width: 80, height: 80 },
          outerCircle: { width: 80, height: 80, borderRadius: 40 },
          innerCircle: { width: 60, height: 60, borderRadius: 30 },
          calendar: { width: 50, height: 35, borderRadius: 5 },
          clock: { width: 20, height: 20, borderRadius: 10 },
          checkmark: { fontSize: 20 },
          text: { fontSize: 16 }
        };
      case 'extra-large':
        return {
          container: { width: 120, height: 120 },
          outerCircle: { width: 120, height: 120, borderRadius: 60 },
          innerCircle: { width: 90, height: 90, borderRadius: 45 },
          calendar: { width: 75, height: 52, borderRadius: 7 },
          clock: { width: 30, height: 30, borderRadius: 15 },
          checkmark: { fontSize: 30 },
          text: { fontSize: 20 }
        };
      default: // medium
        return {
          container: { width: 48, height: 48 },
          outerCircle: { width: 48, height: 48, borderRadius: 24 },
          innerCircle: { width: 36, height: 36, borderRadius: 18 },
          calendar: { width: 30, height: 21, borderRadius: 3 },
          clock: { width: 12, height: 12, borderRadius: 6 },
          checkmark: { fontSize: 12 },
          text: { fontSize: 12 }
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          outerColor: '#34C759',
          innerColor: '#28A745',
          accentColor: '#FF9500',
          textColor: '#34C759'
        };
      case 'minimal':
        return {
          outerColor: '#666',
          innerColor: '#888',
          accentColor: '#007AFF',
          textColor: '#666'
        };
      default: // primary
        return {
          outerColor: '#007AFF',
          innerColor: '#34C759',
          accentColor: '#FF3B30',
          textColor: '#007AFF'
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.container, sizeStyles.container]}>
      {/* Outer Circle */}
      <View style={[
        styles.outerCircle, 
        sizeStyles.outerCircle, 
        { backgroundColor: variantStyles.outerColor }
      ]}>
        {/* Inner Circle */}
        <View style={[
          styles.innerCircle, 
          sizeStyles.innerCircle, 
          { backgroundColor: variantStyles.innerColor }
        ]}>
          {/* Calendar Icon */}
          <View style={[
            styles.calendar, 
            sizeStyles.calendar, 
            { backgroundColor: '#fff' }
          ]}>
            {/* Calendar Grid Lines */}
            <View style={styles.calendarGrid}>
              <View style={[styles.gridLine, { width: '100%', height: 1 }]} />
              <View style={[styles.gridLine, { width: '100%', height: 1, top: '33%' }]} />
              <View style={[styles.gridLine, { width: 1, height: '100%', left: '33%' }]} />
              <View style={[styles.gridLine, { width: 1, height: '100%', left: '66%' }]} />
            </View>
          </View>
          
          {/* Clock Icon */}
          <View style={[
            styles.clock, 
            sizeStyles.clock, 
            { backgroundColor: '#fff' }
          ]} />
          
          {/* Checkmark */}
          <Text style={[
            styles.checkmark, 
            sizeStyles.checkmark, 
            { color: '#fff' }
          ]}>✓</Text>
        </View>
      </View>
      
      {showText && (
        <Text style={[
          styles.text, 
          sizeStyles.text, 
          { color: variantStyles.textColor }
        ]}>
          Project Manager
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendar: {
    position: 'absolute',
    top: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarGrid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#007AFF',
  },
  clock: {
    position: 'absolute',
    bottom: 2,
  },
  checkmark: {
    position: 'absolute',
    top: -2,
    left: -2,
    fontWeight: 'bold',
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
});
