/* eslint-disable react-native/no-inline-styles */

import React, { useState } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { APIURL } from './src/constants/api';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MerchantDashboardScreen from './src/screens/MerchantDashboardScreen';
import UserDashboardScreen from './src/screens/UserDashboardScreen';
import MerchantDetailsScreen from './src/screens/MerchantDetailsScreen';
import IntroScreen from './src/screens/IntroScreen';
import { COLORS } from './src/styles/theme';
import FCMService from './src/services/FCMService';
import AdDisplay from './src/components/AdDisplay';
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
  const [currentScreen, setCurrentScreen] = useState<string>('INTRO');
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [dashboardStartTab, setDashboardStartTab] = useState<string>('dashboard');
  const [ads, setAds] = useState([]);
  const [areAdsPaused, setAreAdsPaused] = useState(false); // Restore paused state logic

  // Merchant-specific Brand Ad logic
  const [showBrandAd, setShowBrandAd] = useState(false);
  const [selectedBrandAd, setSelectedBrandAd] = useState<'quickpro' | 'schoolhub'>('quickpro');

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

  // Fetch Ads for Global Display (Users)
  React.useEffect(() => {
    if (user?.role === 'user') {
      const fetchAds = async () => {
        try {
          // Pass token if needed, or if public endpoint
          const config = user.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
          const { data } = await axios.get(`${APIURL}/ads/feed`, config);
          setAds(data);
        } catch (error) {
          console.log("Failed to fetch global ads", error);
        }
      };
      fetchAds();
    }
  }, [user]);

  // Merchant Brand Ad Interval Logic
  // Merchant Brand Ad Interval Logic
  const hasInitialAdRun = React.useRef(false);
  console.log(user);


  React.useEffect(() => {
    let adInterval: any;
    let initialTimeout: any;

    if (user?.role === 'merchant' && !areAdsPaused) {
      // Enforce 15 minutes by default
      const frequencyMinutes = 15;
      const frequencyMs = frequencyMinutes * 60 * 1000;

      // Trigger brand ad based on frequency
      adInterval = setInterval(() => {
        setSelectedBrandAd(Math.random() > 0.5 ? 'quickpro' : 'schoolhub');
        setShowBrandAd(true);
      }, frequencyMs);

      // Only trigger initial ad once per session
      if (!hasInitialAdRun.current) {
        initialTimeout = setTimeout(() => {
          setSelectedBrandAd(Math.random() > 0.5 ? 'quickpro' : 'schoolhub');
          setShowBrandAd(true);
          hasInitialAdRun.current = true;
        }, 5000);
      }
    }

    return () => {
      if (adInterval) clearInterval(adInterval);
      if (initialTimeout) clearTimeout(initialTimeout);
    };
  }, [user?.role, areAdsPaused, (user as any)?.adFrequency]);

  // Pause Controls for Screens
  const pauseAds = () => setAreAdsPaused(true);
  const resumeAds = () => setAreAdsPaused(false);

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

        {/* Global Ad Display Overlay (User Role) */}
        {user?.role === 'user' && ads.length > 0 && !isLoginOrRegister && (
          <AdDisplay
            ads={ads}
            visible={true}
            paused={areAdsPaused}
          />
        )}

        {/* Merchant Brand Ads (Based on Plan) */}
        {user?.role === 'merchant' && !isLoginOrRegister && (
          <>
            {selectedBrandAd === 'schoolhub' && (
              <SchoolHubAd
                visible={showBrandAd}
                onClose={() => setShowBrandAd(false)}
                variant={user?.plan !== 'Basic' ? 'banner' : 'full'}
              />
            )}
            {selectedBrandAd === 'quickpro' && (
              <QuickproAd
                visible={showBrandAd}
                onClose={() => setShowBrandAd(false)}
                variant={user?.plan !== 'Basic' ? 'banner' : 'full'}
              />
            )}
          </>
        )}

        <Toast />
      </View>
    </SafeAreaProvider>
  );
}

export default App;
