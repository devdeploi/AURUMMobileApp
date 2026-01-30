import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../styles/theme';



const IntroScreen = ({ onFinish }) => {
    const [step, setStep] = useState(0); // 0: Aurum, 1: Safpro
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Timer to switch or finish
        const timers = [];

        const nextStepTimer = setTimeout(() => {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                if (step === 0) {
                    setStep(1);
                    // Fade in next step immediately
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }).start();
                } else {
                    onFinish();
                }
            });
        }, 2500); // Display time

        timers.push(nextStepTimer);

        return () => timers.forEach(t => clearTimeout(t));
    }, [step, fadeAnim, onFinish]);

    return (
        <LinearGradient
            colors={['#ebdc87', '#f3e9bd']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {step === 0 ? (
                    <View style={styles.slide}>
                        <Image
                            source={require('../assets/AURUM.png')}
                            style={styles.logo}
                        />
                        {/* <Text style={styles.appTitle}>A U R U M</Text> */}
                        <Text style={styles.tagline}>Future of Chit Funds</Text>
                    </View>
                ) : (
                    <View style={styles.slide}>
                        <Text style={styles.poweredBy}>Powered By</Text>
                        <View style={styles.safproBoxLogo}>
                            <Image
                                source={require('../../public/assests/Safpro-logo.png')}
                                style={styles.safproLogo}
                            />
                        </View>
                    </View>
                )}
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    slide: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    appTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 4,
        marginBottom: 10,
    },
    tagline: {
        fontSize: 16,
        color: COLORS.primary,
        letterSpacing: 1,
        fontStyle: 'italic',
        fontWeight: 'bold',
    },
    poweredBy: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: 'bold',
        // marginBottom: 1,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontStyle: 'italic',
    },
    safproBoxLogo: {
        alignItems: 'center',
        paddingHorizontal: 20,
        // paddingVertical: 10,
    },
    safproLogo: {
        width: 200,
        height: 100,
        resizeMode: 'contain',
    }
});

export default IntroScreen;
