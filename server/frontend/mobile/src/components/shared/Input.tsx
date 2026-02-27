import React, { useState, useEffect, useRef } from 'react';
import { TextInput, View, Text, StyleSheet, Animated } from 'react-native';

type InputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
};

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;

  const isFloating = isFocused || value.length > 0;

  useEffect(() => {
    Animated.timing(animatedLabel, {
      toValue: isFloating ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFloating]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 12,
    top: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 11],
    }),
    color: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: ['#9E9E9E', isFocused ? '#877ED2' : '#9E9E9E'],
    }),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  const inputBorderColor = error ? '#ff3b30' : isFocused ? '#877ED2' : '#EAEAEA';

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {label && (
          <Animated.Text style={labelStyle}>
            {label}
          </Animated.Text>
        )}
        <TextInput
          style={[
            styles.input,
            { borderColor: inputBorderColor },
            isFloating && styles.inputFloating,
          ]}
          placeholder={isFloating ? placeholder : ''}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholderTextColor="#9E9E9E"
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
    minHeight: 56,
  },
  inputFloating: {
    paddingTop: 20,
    paddingBottom: 12,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 4,
  },
});
