import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { FONTS, COLORS } from '../styles/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');

const GoldTicker = ({ onRateUpdate }) => {
    // Generate random placeholder prices for initial display
    const generateRandomPrice = (base) => {
        const variation = Math.random() * 200 - 100; // Random variation between -100 and +100
        return (base + variation).toFixed(2);
    };

    const [goldRates, setGoldRates] = useState({
        buy24: generateRandomPrice(15600),
        buy22: generateRandomPrice(14300),
        buy18: generateRandomPrice(11700),
        loading: true
    });

    useEffect(() => {
        let isMounted = true;

        // Fallback API Strategy
        const APIS = [
            {
                name: 'GoldPrice.org',
                url: 'https://data-asg.goldprice.org/dbXRates/INR',
                parse: (data) => {
                    if (!data.items || data.items.length === 0) throw new Error('Invalid data format');
                    return data.items[0].xauPrice;
                }
            },
            {
                name: 'CoinGecko (PAXG)',
                url: 'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=inr',
                parse: (data) => {
                    if (!data['pax-gold'] || !data['pax-gold'].inr) throw new Error('Invalid data format');
                    return data['pax-gold'].inr;
                }
            }
        ];

        const fetchGoldPrice = async () => {
            let success = false;

            for (const api of APIS) {
                if (success) break;

                try {
                    const response = await fetch(api.url);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const data = await response.json();

                    if (isMounted) {
                        const pricePerOunce = api.parse(data);
                        const pricePerGram24K = pricePerOunce / 31.1035;

                        // India Market Adjustments (2026)
                        // Import Duty (6%) + GST (3%) + Retail Premium/Making/Bank Charges (~2%) = ~11% Markup
                        // Live Spot (~14k) -> Retail (~15.6k)
                        const marketMarkup = 1.11;

                        const buyPrice24 = pricePerGram24K * marketMarkup;
                        const buyPrice22 = buyPrice24 * (22 / 24);
                        const buyPrice18 = buyPrice24 * (18 / 24);

                        const rate24 = buyPrice24.toFixed(2);

                        setGoldRates({
                            buy24: rate24,
                            buy22: buyPrice22.toFixed(2),
                            buy18: buyPrice18.toFixed(2),
                            loading: false
                        });

                        // Notify parent if callback provided
                        if (onRateUpdate) {
                            onRateUpdate(rate24);
                        }
                        success = true;
                    }
                } catch (error) {
                    console.warn(`Failed to fetch gold price from ${api.name}`, error);
                }
            }

            if (!success && isMounted) {
                console.error("All gold price APIs failed");
                setGoldRates(prev => ({ ...prev, loading: false }));
            }
        };

        fetchGoldPrice();
        const interval = setInterval(fetchGoldPrice, 60000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <LinearGradient
            colors={['#eadb84ff', '#ebdc87']}
            style={styles.cardContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={styles.cardHeader}>
                <View style={styles.liveTagContainer}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE MARKET</Text>
                </View>
                <View style={styles.headerTitleRow}>
                    <View style={styles.iconCircle}>
                        <Icon name="coins" size={12} color="#B7791F" />
                    </View>
                    <Text style={styles.headerTitle}>Today's Gold Rates</Text>
                </View>
            </View>

            <View style={styles.ratesRow}>
                {/* 24K */}
                <View style={[styles.rateBox, styles.borderRight]}>
                    <Text style={styles.karatLabel}>24K (99.9%)</Text>
                    <Text style={styles.priceText}>₹{goldRates.buy24 || '0.00'}</Text>
                    <Text style={styles.unitLabel}>/gm</Text>
                </View>

                {/* 22K */}
                <View style={[styles.rateBox, styles.borderRight]}>
                    <Text style={styles.karatLabel}>22K (91.6%)</Text>
                    <Text style={styles.priceText}>₹{goldRates.buy22 || '0.00'}</Text>
                    <Text style={styles.unitLabel}>/gm</Text>
                </View>

                {/* 18K */}
                <View style={styles.rateBox}>
                    <Text style={styles.karatLabel}>18K (75%)</Text>
                    <Text style={styles.priceText}>₹{goldRates.buy18 || '0.00'}</Text>
                    <Text style={styles.unitLabel}>/gm</Text>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 20,
        // padding: 15,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(183, 121, 31, 0.15)'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        padding: 10
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    iconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF8E1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.dark
    },
    liveTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.danger,
        marginRight: 6
    },
    liveText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.danger
    },
    ratesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    rateBox: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 5
    },
    borderRight: {
        borderRightWidth: 1,
        borderRightColor: '#F3F4F6'
    },
    karatLabel: {
        fontSize: 11,
        color: COLORS.secondary,
        marginBottom: 4,
        fontWeight: '600'
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#B7791F', // Gold/Bronze color
        marginBottom: 2
    },
    unitLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        marginBottom: 20
    }
});

export default GoldTicker;
