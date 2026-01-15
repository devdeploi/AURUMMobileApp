
import React, { useState } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MerchantDashboardScreen from './src/screens/MerchantDashboardScreen';
import UserDashboardScreen from './src/screens/UserDashboardScreen';
import MerchantDetailsScreen from './src/screens/MerchantDetailsScreen';
import { COLORS } from './src/styles/theme';


type Role = 'merchant' | 'user';

interface UserData {
  name: string;
  email: string;
  role: Role;
  id: number;
  plan: string | null;
  phone?: string;
  address?: string;
}

function App() {
  /* ... inside App component ... */
  const [currentScreen, setCurrentScreen] = useState<string>('LOGIN'); // LOGIN, REGISTER, MERCHANT_DASHBOARD, USER_DASHBOARD, MERCHANT_DETAILS
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [dashboardStartTab, setDashboardStartTab] = useState<string>('dashboard');

  // ... handlers ...

  const handleLogin = (role: string, userData: UserData) => {
    setUser(userData);
    if (role === 'merchant') {
      setCurrentScreen('MERCHANT_DASHBOARD');
    } else {
      setDashboardStartTab('dashboard');
      setCurrentScreen('USER_DASHBOARD');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('LOGIN');
    setSelectedMerchant(null);
  };

  const handleRegisterClick = () => {
    setCurrentScreen('REGISTER');
  };

  const handleRegisterSubmit = (userData: UserData) => {
    // Auto login after register? Or go to Login? 
    // User prompt: "before user login he needs to register". Implicitly go to login after or auto-login.
    // Let's auto-login for better UX.
    setUser(userData);
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

  const renderScreen = () => {
    switch (currentScreen) {
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
          />
        );
      case 'USER_DASHBOARD':
        return (
          <UserDashboardScreen
            user={user}
            onLogout={handleLogout}
            onSelectMerchant={handleSelectMerchant}
            initialTab={dashboardStartTab}
          />
        );
      case 'MERCHANT_DETAILS':
        return (
          <MerchantDetailsScreen
            merchant={selectedMerchant}
            onBack={handleBackFromMerchantDetails}
          />
        );
      default:
        return <LoginScreen onLogin={handleLogin} onRegisterClick={handleRegisterClick} />;
    }
  };


  const isLoginOrRegister = currentScreen === 'LOGIN' || currentScreen === 'REGISTER';

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: isLoginOrRegister ? COLORS.backgroundGradient[0] : COLORS.light }}>
        <StatusBar
          barStyle={isLoginOrRegister ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        {renderScreen()}
        <Toast />
      </View>
    </SafeAreaProvider>
  );
}

export default App;
