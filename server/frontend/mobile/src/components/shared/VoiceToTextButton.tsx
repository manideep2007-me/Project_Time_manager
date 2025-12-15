import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Conditionally import Voice - it may not be available in Expo Go
let Voice: any = null;
try {
  Voice = require('@react-native-voice/voice').default;
} catch (error) {
  console.log('Voice module not available - using fallback');
}

// Detect if running in Expo Go - if Voice module is null on native, we're in Expo Go
const isExpoGo = () => {
  // On web, always allow (uses Web Speech API)
  if (Platform.OS === 'web') {
    return false;
  }
  // On native: if Voice is null, we're in Expo Go
  return Voice === null;
};

interface VoiceToTextButtonProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  style?: any;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function VoiceToTextButton({ 
  onResult, 
  onError, 
  disabled = false,
  style,
  size = 'medium',
  color = '#007AFF'
}: VoiceToTextButtonProps) {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const tRef = useRef(t);
  
  // Update refs when values change
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const getLanguageCode = () => {
    const lang = i18n.language || 'en';
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'te': 'te-IN',
      'ta': 'ta-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
    };
    return langMap[lang] || 'en-US';
  };

  useEffect(() => {
    // Priority 1: Check Web Speech API (works immediately in browsers)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = getLanguageCode();
        
        // Set up event handlers
        recognitionRef.current.onresult = (event: any) => {
          if (event.results && event.results.length > 0) {
            const transcript = event.results[0][0].transcript;
            onResult(transcript.trim());
          }
          setIsListening(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          setIsListening(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          let errorMessage = 'Voice recognition error';
          
          if (event.error === 'no-speech') {
            errorMessage = 'No speech detected. Please try again.';
          } else if (event.error === 'audio-capture') {
            errorMessage = 'No microphone found. Please check your device.';
          } else if (event.error === 'not-allowed') {
            errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
          } else if (event.error === 'network') {
            errorMessage = 'Network error. Please check your connection.';
          } else if (event.error === 'aborted') {
            errorMessage = 'Speech recognition aborted.';
          } else {
            errorMessage = `Error: ${event.error}`;
          }

          if (onError) {
            onError(errorMessage);
          } else {
            Alert.alert('Voice Recognition Error', errorMessage, [{ text: 'OK' }]);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        };

        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };

        return () => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.abort();
            } catch (e) {
              // Ignore errors on cleanup
            }
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };
      } else {
        console.warn('Web Speech API not supported in this browser');
        setIsSupported(false);
      }
      return;
    }

    // Priority 2: Check native Voice module (for development builds)
    if (Voice) {
      // Check if voice recognition is available
      Voice.isAvailable()
        .then((available: boolean) => {
          setIsSupported(available);
        })
        .catch(() => {
          setIsSupported(false);
        });
      
      // Set up voice recognition event handlers only if Voice is available
      if (Voice) {
        try {
          // Only set handlers if Voice object exists and has the properties
          if (Voice && typeof Voice === 'object') {
            Voice.onSpeechStart = () => {
              console.log('Speech recognition started');
              setIsListening(true);
            };

            Voice.onSpeechEnd = () => {
              console.log('Speech recognition ended');
              setIsListening(false);
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            };

            Voice.onSpeechResults = (e: any) => {
              console.log('Speech results:', e);
              if (e.value && e.value.length > 0) {
                const transcript = e.value[0];
                console.log('Transcript:', transcript);
                onResult(transcript.trim());
              }
              setIsListening(false);
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            };

            Voice.onSpeechPartialResults = (e: any) => {
              console.log('Partial results:', e);
            };

            Voice.onSpeechError = (e: any) => {
              console.error('Speech error:', e);
              setIsListening(false);
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              
              let errorMessage = 'Voice recognition error';
              
              if (e.error) {
                if (e.error.code === 'ERROR_NO_MATCH') {
                  errorMessage = 'No speech detected. Please try again.';
                } else if (e.error.code === 'ERROR_AUDIO') {
                  errorMessage = 'Microphone permission denied. Please allow microphone access in your device settings.';
                } else if (e.error.code === 'ERROR_SERVER') {
                  errorMessage = 'Server error. Please check your internet connection.';
                } else if (e.error.code === 'ERROR_NETWORK') {
                  errorMessage = 'Network error. Please check your connection.';
                } else if (e.error.message) {
                  errorMessage = e.error.message;
                } else if (typeof e.error === 'string') {
                  errorMessage = e.error;
                }
              }

              if (onError) {
                onError(errorMessage);
              } else {
                Alert.alert('Voice Recognition Error', errorMessage, [{ text: 'OK' }]);
              }
            };
          }
        } catch (error) {
          console.error('Error setting up Voice event handlers:', error);
          setIsSupported(false);
        }
      }

      // Cleanup on unmount
      return () => {
        try {
          if (Voice && Voice !== null && typeof Voice === 'object') {
            // Clear event handlers first
            try {
              if (typeof Voice.removeAllListeners === 'function') {
                Voice.removeAllListeners();
              }
              // Clear individual handlers if they exist
              if (Voice.onSpeechStart) Voice.onSpeechStart = null;
              if (Voice.onSpeechEnd) Voice.onSpeechEnd = null;
              if (Voice.onSpeechResults) Voice.onSpeechResults = null;
              if (Voice.onSpeechPartialResults) Voice.onSpeechPartialResults = null;
              if (Voice.onSpeechError) Voice.onSpeechError = null;
            } catch (e) {
              // Ignore errors when clearing handlers
            }
            
            if (isListeningRef.current) {
              Voice.stop()
                .then(() => {
                  if (Voice && typeof Voice.destroy === 'function') {
                    Voice.destroy().catch(() => {
                      // Ignore destroy errors
                    });
                  }
                })
                .catch(() => {
                  // Ignore stop errors
                });
            }
          }
        } catch (error) {
          // Silently fail - component is unmounting anyway
          // Don't log errors during cleanup to avoid noise
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    } else {
      // Not supported in Expo Go
      setIsSupported(false);
    }
  }, [onResult, onError, i18n.language]);

  const handlePress = async () => {
    if (disabled) return;

    // If already listening, stop it
    if (isListening) {
      await handleStop();
      return;
    }

    // Check if in Expo Go (native mobile without development build)
    if (isExpoGo() && Platform.OS !== 'web') {
      Alert.alert(
        'Development Build Required',
        'Voice-to-text requires a custom development build.\n\nTo use this feature:\n\n1. Build the app with: npx expo run:ios or npx expo run:android\n2. Install the development build on your device\n3. The microphone button will work automatically\n\nOr test on web where it works immediately.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if not supported
    if (!isSupported) {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Not Supported',
          'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Not Available',
          'Voice recognition is not available on this device. Please ensure you have a development build installed.',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    try {
      // Priority 1: Web Speech API (works immediately in browsers)
      if (Platform.OS === 'web' && recognitionRef.current) {
        const recognition = recognitionRef.current;
        recognition.lang = getLanguageCode();
        
        // Start listening
        recognition.start();
        setIsListening(true);

        // Auto-stop after 30 seconds
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isListeningRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              console.error('Error stopping recognition:', e);
            }
          }
          setIsListening(false);
        }, 30000);
      } 
      // Priority 2: Native Voice module (for development builds)
      else if (Voice && typeof Voice.isAvailable === 'function') {
        // Check availability first
        try {
          const available = await Voice.isAvailable();
          if (!available) {
            Alert.alert(
              'Not Available', 
              'Voice recognition is not available on this device. Please check your device settings and ensure microphone permissions are granted.',
              [{ text: 'OK' }]
            );
            return;
          }

          // Request permissions (this will show permission dialog if needed)
          if (typeof Voice.start === 'function') {
            // Start listening - this will request permissions automatically
            await Voice.start(getLanguageCode());
            setIsListening(true);
            console.log('Voice recognition started successfully');

            // Auto-stop after 30 seconds
            timeoutRef.current = setTimeout(async () => {
              if (isListeningRef.current && Voice && typeof Voice.stop === 'function') {
                try {
                  await Voice.stop();
                  setIsListening(false);
                } catch (error) {
                  console.error('Error stopping voice:', error);
                  setIsListening(false);
                }
              }
            }, 30000);
          }
        } catch (startError: any) {
          console.error('Error starting voice recognition:', startError);
          setIsListening(false);
          
          let errorMessage = 'Failed to start voice recognition';
          
          if (startError.message?.includes('permission') || startError.message?.includes('Permission')) {
            errorMessage = 'Microphone permission denied. Please allow microphone access in your device settings.';
            if (Platform.OS === 'ios') {
              Alert.alert(
                'Permission Required',
                errorMessage,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Open Settings', 
                    onPress: () => Linking.openSettings() 
                  }
                ]
              );
            } else {
              Alert.alert('Permission Required', errorMessage, [{ text: 'OK' }]);
            }
          } else if (startError.message) {
            errorMessage = startError.message;
          }
          
          if (onError) {
            onError(errorMessage);
          } else {
            Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
          }
        }
      }
    } catch (error: any) {
      console.error('Unexpected error in handlePress:', error);
      setIsListening(false);
      let errorMessage = error.message || 'Error starting voice recognition';
      
      if (onError) {
        onError(errorMessage);
      } else {
        Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
      }
    }
  };

  const handleStop = async () => {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (Platform.OS === 'web' && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping web recognition:', e);
        }
      } else if (Voice && typeof Voice.stop === 'function' && isListeningRef.current) {
        try {
          await Voice.stop();
          console.log('Voice recognition stopped');
        } catch (error) {
          console.error('Error stopping voice:', error);
        }
      }
      
      setIsListening(false);
    } catch (error) {
      console.error('Error in handleStop:', error);
      setIsListening(false);
    }
  };

  const iconSize = size === 'small' ? 18 : size === 'large' ? 24 : 20;
  const buttonSize = size === 'small' ? 36 : size === 'large' ? 48 : 40;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { width: buttonSize, height: buttonSize, backgroundColor: color },
        isListening && styles.buttonListening,
        disabled && styles.buttonDisabled,
        style
      ]}
      onPress={isListening ? handleStop : handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {isListening ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Ionicons name="mic" size={iconSize} color="#fff" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonListening: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
