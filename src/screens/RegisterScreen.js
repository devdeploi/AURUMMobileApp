/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    // SafeAreaView,
    ActivityIndicator,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { COLORS } from '../styles/theme';
import { APIURL } from '../constants/api';
import Icon from 'react-native-vector-icons/FontAwesome5';
import CustomAlert from '../components/CustomAlert';
import FCMService from '../services/FCMService';
import TermsAndConditions from '../components/TermsAndConditions';
import UserPolicy from '../components/UserPolicy';

const RegisterScreen = ({ onRegister, onSwitchToLogin }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // OTP & Step State
    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Terms & Policy State
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showPolicy, setShowPolicy] = useState(false);

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

    const handleSendOtp = async () => {
        if (!firstName || !lastName || !email || !password || !phone) {
            setAlertConfig({ visible: true, title: 'Error', message: 'Please fill all fields', type: 'error' });
            return;
        }
        if (password !== confirmPassword) {
            setAlertConfig({ visible: true, title: 'Error', message: 'Passwords do not match', type: 'error' });
            return;
        }

        if (!termsAccepted) {
            setAlertConfig({ visible: true, title: 'Required', message: 'Please accept the Terms and Conditions & User Policy to proceed.', type: 'warning' });
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${APIURL}/merchants/send-reg-otp`, { email, phone });
            console.log('Send Reg OTP Success:', response.data);
            setAlertConfig({
                visible: true,
                title: 'Success',
                message: `OTP sent to ${email}`,
                type: 'success',
                buttons: [{ text: 'OK', onPress: () => setStep(2) }]
            });
        } catch (error) {
            console.log('Send Reg OTP Error:', error.response?.data || error.message);
            console.log("error", error);

            console.error(error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: error.response?.data?.message || 'Failed to send OTP',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndRegister = async () => {
        if (otp.length !== 6) {
            setAlertConfig({ visible: true, title: 'Error', message: 'Please enter a valid 6-digit OTP', type: 'error' });
            return;
        }

        setIsLoading(true);
        try {
            // 1. Verify OTP
            const verifyRes = await axios.post(`${APIURL}/merchants/verify-reg-otp`, { email, otp });
            console.log('Verify Reg OTP Success:', verifyRes.data);

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
            console.log('User Registration Success:', data);

            setAlertConfig({
                visible: true,
                title: 'Success',
                message: 'Account created successfully!',
                type: 'success',
                buttons: [{
                    text: 'Login Now',
                    onPress: () => {
                        FCMService.displayLocalNotification('Welcome to Aurum', 'Your account has been created successfully!');
                        onRegister(data);
                    }
                }]
            });

        } catch (error) {
            console.log('Registration Error:', error.response?.data || error.message);
            console.error(error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: error.response?.data?.message || 'Registration failed',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

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
                        <Text style={styles.title}>USER SIGN UP</Text>
                        <Text style={styles.subtitle}>
                            {step === 1 ? 'REGISTER WITH AURUM' : 'VERIFY EMAIL'}
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

                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Confirm Password"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        <Icon name={showConfirmPassword ? 'eye' : 'eye-slash'} size={20} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {password && confirmPassword && password !== confirmPassword && (
                                    <Text style={styles.errorText}>Passwords do not match</Text>
                                )}
                                {password && confirmPassword && password === confirmPassword && (
                                    <Text style={styles.successText}>Passwords match</Text>
                                )}

                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Address"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={address}
                                    numberOfLines={3}
                                />

                                {/* Terms & Conditions Checkbox */}
                                <View style={styles.termsContainer}>
                                    <TouchableOpacity
                                        style={styles.checkbox}
                                        onPress={() => setTermsAccepted(!termsAccepted)}
                                    >
                                        <Icon
                                            name={termsAccepted ? 'check-square' : 'square'}
                                            size={20}
                                            color={termsAccepted ? COLORS.primary : COLORS.textSecondary}
                                        />
                                    </TouchableOpacity>
                                    <View style={styles.termsTextContainer}>
                                        <Text style={styles.termsText}>I accept the </Text>
                                        <TouchableOpacity onPress={() => setShowTerms(true)}>
                                            <Text style={styles.termsLink}>Terms & Conditions</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.termsText}> and </Text>
                                        <TouchableOpacity onPress={() => setShowPolicy(true)}>
                                            <Text style={styles.termsLink}>User Policy</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

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
                                <Text style={styles.loginLink}>SIGN IN</Text>
                            </TouchableOpacity>
                        </View>
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

            {/* Terms & Policy Modals */}
            <TermsAndConditions visible={showTerms} onClose={() => setShowTerms(false)} />
            <UserPolicy visible={showPolicy} onClose={() => setShowPolicy(false)} />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 15,
        fontWeight: "700",
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
        borderWidth: 0.5,
        borderColor: COLORS.primary,
    },
    rowInputLeft: {
        flex: 1,
        marginRight: 5,
        backgroundColor: COLORS.inputBackground,
        borderRadius: 10,
        padding: 15,
        color: COLORS.textPrimary,
        borderWidth: 0.5,
        borderColor: COLORS.primary,
    },
    rowInputRight: {
        flex: 1,
        marginLeft: 5,
        backgroundColor: COLORS.inputBackground,
        borderRadius: 10,
        padding: 15,
        color: COLORS.textPrimary,
        borderWidth: 0.5,
        borderColor: COLORS.primary,
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
        borderWidth: 0.5,
        borderColor: COLORS.primary,
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
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 5,
        alignSelf: 'flex-start'
    },
    successText: {
        color: COLORS.success,
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 5,
        alignSelf: 'flex-start'
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 5
    },
    checkbox: {
        marginRight: 10
    },
    termsTextContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        flex: 1
    },
    termsText: {
        color: COLORS.textSecondary,
        fontSize: 12
    },
    termsLink: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 12,
        textDecorationLine: 'underline'
    }
});

export default RegisterScreen;
