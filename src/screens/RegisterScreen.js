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
import { COLORS } from '../styles/theme';
import { APIURL } from '../constants/api';
import Icon from 'react-native-vector-icons/FontAwesome5';

const RegisterScreen = ({ onRegister, onSwitchToLogin }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // OTP & Step State
    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOtp = async () => {
        if (!firstName || !lastName || !email || !password || !phone) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            // Send OTP (Route is generic on backend now)
            await axios.post(`${APIURL}/merchants/send-reg-otp`, { email });
            Alert.alert('Success', `OTP sent to ${email}`);
            setStep(2);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndRegister = async () => {
        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Verify OTP
            await axios.post(`${APIURL}/merchants/verify-reg-otp`, { email, otp });

            // 2. Register User
            const userData = {
                name: `${firstName} ${lastName}`,
                email,
                phone,
                address,
                password,
                role: 'user'
            };

            const { data } = await axios.post(`${APIURL}/users`, userData);

            Alert.alert('Success', 'Account created successfully!');

            // Log them in immediately or switch to login
            // onRegister usually handles the successful auth state in the parent
            // But let's check if onRegister expects user data or just switches view
            // Assuming onRegister propagates login
            onRegister(data);

        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Icon name="user-plus" size={40} color={COLORS.primary} style={styles.headerIcon} />
                    <Text style={styles.title}>Create User Account</Text>
                    <Text style={styles.subtitle}>
                        {step === 1 ? 'Enter your details' : 'Verify your email'}
                    </Text>

                    {step === 1 ? (
                        <>
                            <View style={styles.row}>
                                <TextInput
                                    style={styles.rowInputLeft}
                                    placeholder="First Name"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                                <TextInput
                                    style={styles.rowInputRight}
                                    placeholder="Last Name"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                placeholderTextColor={COLORS.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                placeholderTextColor={COLORS.textSecondary}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Address"
                                placeholderTextColor={COLORS.textSecondary}
                                value={address}
                                onChangeText={setAddress}
                            />

                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
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

                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                placeholderTextColor={COLORS.textSecondary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />

                            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={isLoading}>
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Next</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter 6-digit OTP"
                                placeholderTextColor={COLORS.textSecondary}
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="numeric"
                                maxLength={6}
                            />
                            <TouchableOpacity style={styles.button} onPress={handleVerifyAndRegister} disabled={isLoading}>
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Verify & Register</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStep(1)} style={styles.linkButton}>
                                <Text style={styles.linkText}>Back to Details</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={onSwitchToLogin}>
                            <Text style={styles.loginLink}>Login Here</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundGradient[0],
        justifyContent: 'center',
    },
    scrollContent: {
        padding: 20,
        justifyContent: 'center',
        flexGrow: 1,
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
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 15,
    },
    input: {
        width: '100%',
        backgroundColor: COLORS.inputBackground,
        borderRadius: 10,
        padding: 15,
        color: COLORS.textPrimary,
        marginBottom: 15,
    },
    rowInputLeft: {
        flex: 1,
        marginRight: 5,
        backgroundColor: COLORS.inputBackground,
        borderRadius: 10,
        padding: 15,
        color: COLORS.textPrimary,
    },
    rowInputRight: {
        flex: 1,
        marginLeft: 5,
        backgroundColor: COLORS.inputBackground,
        borderRadius: 10,
        padding: 15,
        color: COLORS.textPrimary,
    },
    passwordInput: {
        marginBottom: 0,
        flex: 1,
        borderRightWidth: 0,
        backgroundColor: 'transparent', // Inherit from container or explicit
        padding: 15,
        color: COLORS.textPrimary,
        height: '100%'
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
        paddingRight: 15,
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
    footer: {
        flexDirection: 'row',
        marginTop: 20,
    },
    footerText: {
        color: COLORS.textSecondary,
    },
    loginLink: {
        color: COLORS.textPrimary,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    linkButton: {
        marginTop: 10
    },
    linkText: {
        color: COLORS.textPrimary,
        textDecorationLine: 'underline'
    }
});

export default RegisterScreen;
