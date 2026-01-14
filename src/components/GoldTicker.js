import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { FONTS, COLORS } from '../styles/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');

const GoldTicker = () => {
    const [goldRate, setGoldRate] = useState({ price: 0, loading: true });
    const shimmerValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const fetchGoldPrice = async () => {
            try {
                const response = await fetch('https://data-asg.goldprice.org/dbXRates/INR');
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    const pricePerOunce = data.items[0].xauPrice;
                    const marketPrice = pricePerOunce / 31.1035;
                    const buyPrice = marketPrice * 1.03;
                    setGoldRate({
                        price: buyPrice.toFixed(2),
                        loading: false
                    });
                }
            } catch (error) {
                console.error("Failed to fetch gold price", error);
                setGoldRate(prev => ({ ...prev, loading: false }));
            }
        };

        fetchGoldPrice();
        const interval = setInterval(fetchGoldPrice, 60000);

        // Shimmer Animation
        Animated.loop(
            Animated.timing(shimmerValue, {
                toValue: 1,
                duration: 2500,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            })
        ).start();

        return () => clearInterval(interval);
    }, [shimmerValue]);

    const translateX = shimmerValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View style={styles.tickerContainer}>
            <View style={styles.goldPill}>
                {/* Shimmer Effect */}
                <View style={styles.shimmerContainer}>
                    <Animated.View
                        style={[
                            styles.shimmer,
                            {
                                transform: [{ translateX }, { skewX: '-20deg' }]
                            }
                        ]}
                    />
                </View>

                {/* Content */}
                <View style={styles.contentRow}>
                    <View style={styles.iconCircle}>
                        <Icon name="coins" size={14} color="#B7791F" />
                    </View>

                    <View style={styles.infoContainer}>
                        <Text style={styles.label}>GOLD RATE (24K)</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.currency}>₹</Text>
                            <Text style={styles.price}>
                                {goldRate.loading ? '---.--' : goldRate.price}
                            </Text>
                            <Text style={styles.unit}>/gm</Text>
                        </View>
                    </View>

                    <View style={[styles.trendIndicator, !goldRate.loading && styles.trendActive]}>
                        <Icon name="arrow-up" size={10} color={COLORS.success} />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    tickerContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    goldPill: {
        backgroundColor: '#fff',
        borderRadius: 40,
        paddingVertical: 8,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // Modern blurred shadow look
        shadowColor: '#B7791F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(183, 121, 31, 0.2)', // Subtle gold border
        overflow: 'hidden',
        minWidth: '70%'
    },
    shimmerContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    shimmer: {
        width: '40%',
        height: '100%',
        backgroundColor: 'rgba(255, 215, 0, 0.15)', // Light gold shimmer
        opacity: 0.8,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 2,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF8E1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#FFE082'
    },
    infoContainer: {
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        color: '#8D6E63',
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 2
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline'
    },
    currency: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: 'bold',
        marginRight: 2
    },
    price: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
    },
    unit: {
        fontSize: 10,
        color: '#A1887F',
        marginLeft: 2,
        fontWeight: '500'
    },
    trendIndicator: {
        marginLeft: 12,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#F0FFF4',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.5
    },
    trendActive: {
        opacity: 1
    }
});

export default GoldTicker;
