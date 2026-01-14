/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    SafeAreaView,
    ActivityIndicator
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { COLORS } from '../styles/theme';
import { APIURL } from '../constants/api';

const LoginScreen = ({ onLogin, onRegisterClick }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

    const handleLogin = async () => {
        if (!email.includes('@') || password.length === 0) {
            Alert.alert('Error', 'Please enter a valid email and password');
            return;
        }

        setIsLoading(true);

        try {
            // Try User/Admin Login first
            try {
                const { data } = await axios.post(`${APIURL}/users/login`, { email, password });
                onLogin(data.role, data);
            } catch (err) {
                // If User login fails, try Merchant Login
                if (err.response && (err.response.status === 401 || err.response.status === 404)) {
                    const { data } = await axios.post(`${APIURL}/merchants/login`, { email, password });

                    if (data.otpSent) {
                        setMerchantLoginStep(2);
                        Alert.alert('OTP Sent', `Verification code sent to ${email}`);
                    } else {
                        onLogin('merchant', data);
                    }
                } else {
                    throw err;
                }
            }
        } catch (error) {
            console.error('Login Error:', error);
            const msg = error.response?.data?.message || 'Login failed. Please check credentials or network.';
            Alert.alert('Error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMerchantVerifyOtp = async () => {
        if (merchantOtp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }
        setIsLoading(true);
        try {
            const { data } = await axios.post(`${APIURL}/merchants/verify-login-otp`, {
                email,
                otp: merchantOtp
            });
            onLogin('merchant', data);
        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid OTP';
            Alert.alert('Error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOtp = () => {
        if (resetEmail && resetEmail.includes('@')) {
            const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(randomOtp);
            Alert.alert('OTP Sent', `Your OTP is ${randomOtp}`);
            setResetStep(2);
        } else {
            Alert.alert('Error', 'Please enter a valid email');
        }
    };

    const handleVerifyOtp = () => {
        if (otp === generatedOtp) {
            setResetStep(3);
        } else {
            Alert.alert('Error', 'Invalid OTP');
        }
    };

    const handleResetPassword = () => {
        if (newPassword === confirmNewPassword && newPassword.length > 0) {
            Alert.alert('Success', 'Password reset successful');
            setIsForgotPassword(false);
            setResetStep(1);
            setResetEmail('');
            setNewPassword('');
            setOtp('');
        } else {
            Alert.alert('Error', 'Passwords do not match or are empty');
        }
    };

    if (isForgotPassword) {
        return (
            <SafeAreaView style={styles.container}>
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
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.card}>
                    <Icon name="gem" size={50} color={COLORS.primary} style={styles.headerIcon} />
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>

                    {merchantLoginStep === 1 ? (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter email"
                                placeholderTextColor={COLORS.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />

                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, { marginBottom: 0, flex: 1, borderRightWidth: 0 }]}
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

                            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                                {isLoading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={styles.buttonText}>Login</Text>
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
                            <Text style={styles.registerLink}>Register Here</Text>
                        </TouchableOpacity>
                    </View>
                    {/* <Text style={styles.envInfo}>
                        (Use 'merchant@test.com' for Merchant, else User)
                    </Text> */}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundGradient[0], // Fallback solid color
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 30,
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
    }
});

export default LoginScreen;
