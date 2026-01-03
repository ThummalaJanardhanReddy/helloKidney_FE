import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { images } from '../../assets';

export default function AppSplashScreen() {
  useEffect(() => {
    console.log('SplashScreen component mounted');

    const initializeApp = async () => {
      try {
        // Wait a bit for the app to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Navigate to welcome screen first (bypasses RegistrationGuard)
        console.log('Navigating to welcome screen...');
        router.replace('/components/welcome');
        // router.replace('/(main)/home' as any);
        // router.replace('/(tabs)' as any); // Temporary direct navigation to main tabs
        console.log('Navigation command sent');
      } catch (error) {
        console.error('Error during app initialization:', error);
        // Fallback navigation
        router.replace('/components/welcome');
      }
    };

    initializeApp();
  }, []);

  return (
    <View style={styles.container}>
      {/* <StatusBar 
        barStyle="light-content" 
        backgroundColor="#694664" 
        translucent={false}
      /> */}
      <Image source={images.splashscreen} style={styles.logo} resizeMode='contain'/>
      {/* <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EF3024',
    justifyContent: 'center',
    alignItems: 'center',
    // paddingTop: 0,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // width: wp(100),
    // height: hp(100),
  },
  logo: {
    // width: wp(100),
    // height: hp(100),
    // resizeMode: 'stretch',
  },
});
