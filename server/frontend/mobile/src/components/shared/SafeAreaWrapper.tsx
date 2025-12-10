import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

export default function SafeAreaWrapper({ 
  children, 
  style, 
  backgroundColor = '#f8f9fa' 
}: SafeAreaWrapperProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      {
        flex: 1,
        backgroundColor,
        paddingTop: insets.top,
      },
      style
    ]}>
      {children}
    </View>
  );
}
