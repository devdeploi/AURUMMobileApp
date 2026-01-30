/* eslint-disable react-native/no-inline-styles */

import React, { useState } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Screens
// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MerchantDashboardScreen from './src/screens/MerchantDashboardScreen';
import UserDashboardScreen from './src/screens/UserDashboardScreen';
import MerchantDetailsScreen from './src/screens/MerchantDetailsScreen';
import IntroScreen from './src/screens/IntroScreen';
import { COLORS } from './src/styles/theme';
import FCMService from './src/services/FCMService';
import SchoolHubAd from './src/components/SchoolHubAd';
import QuickproAd from './src/components/QuickproAd';

import AsyncStorage from '@react-native-async-storage/async-storage';

type Role = 'merchant' | 'user';

interface UserData {
  name: string;
  email: string;
  role: Role;
  id: number;
  plan: string | null;
  phone?: string;
  address?: string;
  token?: string;
}

function App() {
  /* ... inside App component ... */
  const [currentScreen, setCurrentScreen] = useState<string>('INTRO');
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [dashboardStartTab, setDashboardStartTab] = useState<string>('dashboard');
  const [showAd, setShowAd] = useState(false);
  const [selectedAd, setSelectedAd] = useState<'quickpro' | 'schoolhub'>('quickpro');
  const [areAdsPaused, setAreAdsPaused] = useState(false);

  // Check for stored session on mount
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user_session');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error reading session:', error);
      } finally {
        setIsLoadingSession(false);
      }
    };
    checkSession();
  }, []);

  const pauseAds = () => {
    setAreAdsPaused(true);
    setShowAd(false); // Hide ongoing ad if any
  };

  const resumeAds = () => {
    setAreAdsPaused(false);
  };

  // Ad Logic
  React.useEffect(() => {
    let adInterval: any;
    if (user && !areAdsPaused) {
      // Trigger ad every 5 minutes (300000 ms)
      // Initial delay of 1 minute to avoid showing immediately on login
      const timeout = setTimeout(() => {
        setSelectedAd(Math.random() > 0.5 ? 'quickpro' : 'schoolhub');
        setShowAd(true);
        adInterval = setInterval(() => {
          setSelectedAd(Math.random() > 0.5 ? 'quickpro' : 'schoolhub');
          setShowAd(true);
        }, 60000);
      }, 60000); // 1 minute delay before first ad

      return () => {
        clearTimeout(timeout);
        clearInterval(adInterval);
      };
    }
  }, [user, areAdsPaused]);

  // ... handlers ...

  React.useEffect(() => {
    const initNotifications = async () => {
      await FCMService.requestUserPermission();
      await FCMService.createDefaultChannel();
      await FCMService.checkInitialNotification();
    };

    initNotifications();
    const unsubscribe = FCMService.registerForegroundHandler();

    return unsubscribe;
  }, []);

  const handleLogin = async (role: string, userData: UserData) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem('user_session', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving session:', error);
    }

    if (role === 'merchant') {
      setCurrentScreen('MERCHANT_DASHBOARD');
    } else {
      setDashboardStartTab('dashboard');
      setCurrentScreen('USER_DASHBOARD');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user_session');
    } catch (error) {
      console.error('Error removing session:', error);
    }
    setUser(null);
    setCurrentScreen('LOGIN');
    setSelectedMerchant(null);
  };

  const handleRegisterClick = () => {
    setCurrentScreen('REGISTER');
  };

  const handleRegisterSubmit = async (userData: UserData) => {
    // Auto login after register? Or go to Login? 
    // User prompt: "before user login he needs to register". Implicitly go to login after or auto-login.
    // Let's auto-login for better UX.
    setUser(userData);
    try {
      await AsyncStorage.setItem('user_session', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving session:', error);
    }
    if (userData.role === 'merchant') {
      setCurrentScreen('MERCHANT_DASHBOARD');
    } else {
      setCurrentScreen('USER_DASHBOARD');
    }
  };

  const handleSelectMerchant = (merchant: any) => {
    setSelectedMerchant(merchant);
    setCurrentScreen('MERCHANT_DETAILS');
  };

  const handleBackFromMerchantDetails = () => {
    setDashboardStartTab('merchants');
    setCurrentScreen('USER_DASHBOARD');
  };

  const handleUserUpdate = async (updatedUser: any) => {
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const renderScreen = () => {
    if (isLoadingSession) {
      return <View style={{ flex: 1, backgroundColor: COLORS.backgroundGradient[0] }} />;
    }

    switch (currentScreen) {
      case 'INTRO':
        return (
          <IntroScreen
            onFinish={() => {
              if (user) {
                setCurrentScreen(user.role === 'merchant' ? 'MERCHANT_DASHBOARD' : 'USER_DASHBOARD');
              } else {
                setCurrentScreen('LOGIN');
              }
            }}
          />
        );
      case 'LOGIN':
        return (
          <LoginScreen
            onLogin={handleLogin}
            onRegisterClick={handleRegisterClick}
          />
        );
      case 'REGISTER':
        return (
          <RegisterScreen
            onRegister={handleRegisterSubmit}
            onSwitchToLogin={() => setCurrentScreen('LOGIN')}
          />
        );
      case 'MERCHANT_DASHBOARD':
        return (
          <MerchantDashboardScreen
            user={user}
            onLogout={handleLogout}
            onUserUpdate={handleUserUpdate}
            pauseAds={pauseAds}
            resumeAds={resumeAds}
          />
        );
      case 'USER_DASHBOARD':
        return (
          <UserDashboardScreen
            user={user}
            onLogout={handleLogout}
            onSelectMerchant={handleSelectMerchant}
            onUserUpdate={handleUserUpdate}
            initialTab={dashboardStartTab}
          />
        );
      case 'MERCHANT_DETAILS':
        return (
          <MerchantDetailsScreen
            merchant={selectedMerchant}
            onBack={handleBackFromMerchantDetails}
            user={user}
          />
        );
      default:
        return <LoginScreen onLogin={handleLogin} onRegisterClick={handleRegisterClick} />;
    }
  };


  const isLoginOrRegister = currentScreen === 'LOGIN' || currentScreen === 'REGISTER' || currentScreen === 'INTRO';

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: isLoginOrRegister ? COLORS.backgroundGradient[0] : COLORS.light }}>
        <StatusBar
          barStyle={isLoginOrRegister ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        {renderScreen()}
        {selectedAd === 'schoolhub' && (
          <SchoolHubAd
            visible={showAd}
            onClose={() => setShowAd(false)}
            variant={user?.role === 'merchant' && user?.plan === 'Premium' ? 'banner' : 'full'}
          />
        )}
        {selectedAd === 'quickpro' && (
          <QuickproAd
            visible={showAd}
            onClose={() => setShowAd(false)}
            variant={user?.role === 'merchant' && user?.plan === 'Premium' ? 'banner' : 'full'}
          />
        )}
        <Toast />
      </View>
    </SafeAreaProvider>
  );
}

export default App;
