/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,

    ActivityIndicator,
    Image,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../styles/theme';
import { APIURL } from '../constants/api';

import CustomAlert from '../components/CustomAlert';
import FCMService from '../services/FCMService';

const LoginScreen = ({ onLogin, onRegisterClick }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Login Mode: 'password' or 'otp'
    const [loginMode, setLoginMode] = useState('password');
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }
        }
    }, []);

    const switchMode = (mode) => {
        if (mode === loginMode) return;
        const toValue = mode === 'password' ? 0 : 1;

        Animated.timing(slideAnim, {
            toValue,
            duration: 300,
            useNativeDriver: false,
        }).start();

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setLoginMode(mode);
    };

    // Merchant Login OTP State
    const [merchantLoginStep, setMerchantLoginStep] = useState(1);
    const [merchantOtp, setMerchantOtp] = useState('');

    // Forgot Password State
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [resetEmail, setResetEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        buttons: []
    });

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    const handleLogin = async () => {
        // If Phone regex logic needed, can be added. Backend handles "email" field as identifier usually.
        if (password.length === 0 && loginMode === 'password') {
            setAlertConfig({ visible: true, title: 'Error', message: 'Please enter password', type: 'error' });
            return;
        }

        setIsLoading(true);

        try {
            // Try User/Admin Login first if password mode
            // Note: Users currently only have password login.
            if (loginMode === 'password') {
                try {
                    const { data } = await axios.post(`${APIURL}/users/login`, { email, password });
                    await FCMService.registerToken(data._id, data.role, data.token);
                    FCMService.displayLocalNotification('Welcome Back!', `Welcome back, ${data.name || 'User'}!`);
                    onLogin(data.role, data);
                    return; // Success
                } catch (err) {
                    // Fallthrough to Merchant check
                }
            }

            // Merchant Login
            try {
                // If OTP Mode, we don't call login yet, we called send-otp.
                // But if we are here in handleLogin, it implies Password mode login for merchant
                // OR we are reusing this function? 
                // Let's separate it. This function is for Password Login button.

                const { data } = await axios.post(`${APIURL}/merchants/login`, { email, password });

                if (data.otpSent) {
                    setMerchantLoginStep(2);
                    setAlertConfig({ visible: true, title: 'OTP Sent', message: `Verification code sent to ${email} `, type: 'success' });
                } else {
                    // Check for Grace period warning
                    if (data.isGracePeriod) {
                        setAlertConfig({ visible: true, title: 'Warning', message: 'Your subscription has expired. You are in a grace period.', type: 'warning' });
                    }
                    await FCMService.registerToken(data._id, 'merchant', data.token);
                    FCMService.displayLocalNotification('Merchant Login', `Welcome back, ${data.name || 'Merchant'}!`);
                    onLogin('merchant', data);
                }
            } catch (err) {
                // If password mode failed for both
                const msg = err.response?.data?.message || 'Invalid credentials';
                setAlertConfig({ visible: true, title: 'Error', message: msg, type: 'error' });
            }
        } catch (error) {
            console.error('Login Error:', error);
            setAlertConfig({ visible: true, title: 'Error', message: 'Login failed', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendLoginOtp = async () => {
        if (!email) {
            setAlertConfig({ visible: true, title: 'Error', message: 'Please enter email or phone', type: 'error' });
            return;
        }
        setIsLoading(true);
        try {
            await axios.post(`${APIURL}/merchants/send-login-otp`, { email });
            setMerchantLoginStep(2); // Move to OTP entry
            setAlertConfig({ visible: true, title: 'Success', message: 'OTP Sent successfully', type: 'success' });
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to send OTP. Check if registered.';
            setAlertConfig({ visible: true, title: 'Error', message: msg, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMerchantVerifyOtp = async () => {
        if (merchantOtp.length !== 6) {
            setAlertConfig({ visible: true, title: 'Error', message: 'Please enter a valid 6-digit OTP', type: 'error' });
            return;
        }
        setIsLoading(true);
        setIsLoading(true);
        try {
            const { data } = await axios.post(`${APIURL}/merchants/verify-login-otp`, {
                email,
                otp: merchantOtp
            });
            await FCMService.registerToken(data._id, 'merchant', data.token);
            FCMService.displayLocalNotification('OTP Verified', 'Merchant login successful.');
            onLogin('merchant', data);
        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid OTP';
            setAlertConfig({ visible: true, title: 'Error', message: msg, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOtp = () => {
        if (resetEmail && resetEmail.includes('@')) {
            const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(randomOtp);
            setAlertConfig({ visible: true, title: 'OTP Sent', message: `Your OTP is ${randomOtp} `, type: 'success' });
            setResetStep(2);
        } else {
            setAlertConfig({ visible: true, title: 'Error', message: 'Please enter a valid email', type: 'error' });
        }
    };

    const handleVerifyOtp = () => {
        if (otp === generatedOtp) {
            setResetStep(3);
        } else {
            setAlertConfig({ visible: true, title: 'Error', message: 'Invalid OTP', type: 'error' });
        }
    };

    const handleResetPassword = () => {
        if (newPassword === confirmNewPassword && newPassword.length > 0) {
            setAlertConfig({
                visible: true,
                title: 'Success',
                message: 'Password reset successful',
                type: 'success',
                buttons: [{
                    text: 'OK',
                    onPress: () => {
                        setIsForgotPassword(false);
                        setResetStep(1);
                        setResetEmail('');
                        setNewPassword('');
                        setOtp('');
                        hideAlert(); // Close the alert after handling
                    }
                }]
            });
        } else {
            setAlertConfig({ visible: true, title: 'Error', message: 'Passwords do not match or are empty', type: 'error' });
        }
    };

    if (isForgotPassword) {
        return (
            <LinearGradient
                colors={['#ebdc87', '#f3e9bd']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.card}>
                            <Icon name="gem" size={50} color={COLORS.primary} style={styles.headerIcon} />
                            <Text style={styles.title}>Reset Password</Text>
                            <Text style={styles.subtitle}>Enter details to reset</Text>

                            {resetStep === 1 && (
                                <>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter registered email"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={resetEmail}
                                        onChangeText={setResetEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                    <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
                                        <Text style={styles.buttonText}>Send OTP</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {resetStep === 2 && (
                                <>
                                    <Text style={styles.infoText}>OTP sent to {resetEmail}</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter OTP"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="numeric"
                                    />
                                    <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
                                        <Text style={styles.buttonText}>Verify OTP</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {resetStep === 3 && (
                                <>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="New Password"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm New Password"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={confirmNewPassword}
                                        onChangeText={setConfirmNewPassword}
                                        secureTextEntry
                                    />
                                    <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                                        <Text style={styles.buttonText}>Reset Password</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            <TouchableOpacity onPress={() => setIsForgotPassword(false)} style={styles.linkButton}>
                                <Text style={styles.linkText}>Back to Login</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
                <CustomAlert
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    buttons={alertConfig.buttons}
                    onClose={hideAlert}
                />
            </LinearGradient >
        );
    }

    return (
        <LinearGradient
            colors={['#ebdc87', '#f3e9bd']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <Image source={require('../assets/AURUM.png')} style={styles.logo} />
                        {/* <Text style={styles.appTitle}>A U R U M</Text> */}
                        <Text style={styles.title}>SIGN IN</Text>
                        {/* <Text style={styles.subtitle}> </Text> */}

                        {merchantLoginStep === 1 ? (
                            <>
                                {/* Login Mode Tabs */}
                                <View style={styles.tabContainer}>
                                    <Animated.View style={[
                                        styles.activeTabIndicator,
                                        {
                                            left: slideAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '50%']
                                            })
                                        }
                                    ]} />
                                    <TouchableOpacity
                                        style={styles.tab}
                                        onPress={() => switchMode('password')}
                                    >
                                        <Animated.Text style={[styles.tabText, {
                                            color: slideAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [COLORS.white, COLORS.primary]
                                            })
                                        }]}>Password</Animated.Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.tab}
                                        onPress={() => switchMode('otp')}
                                    >
                                        <Animated.Text style={[styles.tabText, {
                                            color: slideAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [COLORS.primary, COLORS.white]
                                            })
                                        }]}>OTP Login</Animated.Text>
                                    </TouchableOpacity>
                                </View>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter email or phone"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                />

                                {loginMode === 'password' && (
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            style={[styles.input, { marginBottom: 0, flex: 1, borderRightWidth: 0, backgroundColor: 'transparent' }]}
                                            placeholder="Password"
                                            placeholderTextColor={COLORS.textSecondary}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity
                                            style={styles.eyeIcon}
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            <Icon name={showPassword ? 'eye' : 'eye-slash'} size={20} color={COLORS.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={loginMode === 'password' ? handleLogin : handleSendLoginOtp}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.buttonText}>
                                            {loginMode === 'password' ? 'Login' : 'Get OTP'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.infoText}>Enter OTP sent to {email}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter 6-digit OTP"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={merchantOtp}
                                    onChangeText={setMerchantOtp}
                                    keyboardType="numeric"
                                    maxLength={6}
                                />
                                <TouchableOpacity style={styles.button} onPress={handleMerchantVerifyOtp} disabled={isLoading}>
                                    {isLoading ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.buttonText}>Verify & Login</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setMerchantLoginStep(1)} style={styles.linkButton}>
                                    <Text style={styles.linkText}>Back to Login</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity onPress={() => setIsForgotPassword(true)} style={styles.linkButton}>
                            <Text style={[styles.linkText, { color: COLORS.textSecondary }]}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>New User? </Text>
                            <TouchableOpacity onPress={onRegisterClick}>
                                <Text style={styles.registerLink}>SIGN UP</Text>
                            </TouchableOpacity>
                        </View>
                        {/* <Text style={styles.envInfo}>
                        (Use 'merchant@test.com' for Merchant, else User)
                    </Text> */}
                    </View>
                </ScrollView>
            </SafeAreaView>
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                buttons={alertConfig.buttons}
                onClose={hideAlert}
            />
        </LinearGradient >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: COLORS.glass,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        alignItems: 'center',
    },
    headerIcon: {
        marginBottom: 20,
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 10,
        resizeMode: 'contain'
    },
    appTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 2,
        marginBottom: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    input: {
        width: '100%',
        backgroundColor: COLORS.inputBackground,
        borderRadius: 10,
        padding: 15,
        color: COLORS.textPrimary,
        marginBottom: 15,
    },
    passwordContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBackground,
        borderRadius: 10,
        marginBottom: 15,
    },
    eyeIcon: {
        padding: 10,
    },
    button: {
        width: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    linkButton: {
        marginBottom: 10,
        marginTop: 5,
    },
    linkText: {
        color: COLORS.textPrimary,
        textDecorationLine: 'underline',
    },
    footer: {
        flexDirection: 'row',
        marginTop: 20,
    },
    footerText: {
        color: COLORS.textSecondary,
    },
    registerLink: {
        color: COLORS.textPrimary,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    infoText: {
        color: COLORS.textPrimary,
        marginBottom: 10,
    },
    envInfo: {
        color: COLORS.textSecondary,
        marginTop: 10,
        fontSize: 10,
        textAlign: 'center'
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: COLORS.inputBackground,
        borderRadius: 12,
        height: 50,
        position: 'relative',
        overflow: 'hidden',
    },
    activeTabIndicator: {
        position: 'absolute',
        width: '50%',
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    tabText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default LoginScreen;
