/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
    Animated,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { COLORS } from '../styles/theme';
import { APIURL, BASE_URL } from '../constants/api';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const MerchantDetailsScreen = ({ merchant, onBack }) => {
    const [activeTab, setActiveTab] = useState('plans');
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [subscribing, setSubscribing] = useState(null);
    const scrollY = new Animated.Value(0);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans, merchant._id]);

    const fetchPlans = async () => {
        try {
            const { data } = await axios.get(`${APIURL}/chit-plans/merchant/${merchant._id}`);
            setPlans(data.plans || []);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load chit plans');
        } finally {
            setLoadingPlans(false);
        }
    };

    const handleSubscribe = async (plan) => {
        Alert.alert(
            'Confirm Subscription',
            `Are you sure you want to subscribe to ${plan.planName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Subscribe',
                    onPress: async () => {
                        setSubscribing(plan._id);
                        try {
                            await axios.post(`${APIURL}/chit-plans/${plan._id}/subscribe`);
                            Alert.alert('Success', 'Subscribed successfully!');
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to subscribe');
                        } finally {
                            setSubscribing(null);
                        }
                    }
                }
            ]
        );
    };

    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [280, 120],
        extrapolate: 'clamp',
    });

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0.8],
        extrapolate: 'clamp',
    });

    const renderContent = () => {
        if (activeTab === 'plans') {
            if (loadingPlans) {
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading Plans...</Text>
                    </View>
                );
            }
            if (plans.length === 0) {
                return (
                    <View style={styles.emptyState}>
                        <Icon name="calendar-times" size={60} color={COLORS.secondary} />
                        <Text style={styles.emptyStateText}>No plans available</Text>
                        <Text style={styles.emptyStateSubtext}>Check back later for new offerings</Text>
                    </View>
                );
            }
            return (
                <ScrollView
                    contentContainerStyle={styles.plansContainer}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    {plans.map((plan, index) => (
                        <Animated.View
                            key={plan._id}
                            style={[
                                styles.planCard,
                                {
                                    transform: [{
                                        translateY: scrollY.interpolate({
                                            inputRange: [0, 100],
                                            outputRange: [0, 10 + index * 5],
                                            extrapolate: 'clamp'
                                        })
                                    }]
                                }
                            ]}
                        >
                            <LinearGradient
                                colors={['#ffffff', '#f8f9ff']}
                                style={styles.planGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.planHeader}>
                                    <View style={styles.planTitleContainer}>
                                        <Text style={styles.planName}>{plan.planName}</Text>
                                    </View>
                                    <View style={styles.planAmountContainer}>
                                        <Text style={styles.planAmount}>₹{plan.totalAmount}</Text>
                                        <Text style={styles.planAmountLabel}>Total Value</Text>
                                    </View>
                                </View>

                                <View style={styles.planDivider} />

                                <View style={styles.planDetails}>
                                    <View style={styles.detailItem}>
                                        <View style={styles.detailIconContainer}>
                                            <Icon name="clock" size={14} color="#fff" />
                                        </View>
                                        <View style={styles.detailContent}>
                                            <Text style={styles.detailLabel}>Duration</Text>
                                            <Text style={styles.detailValue}>{plan.durationMonths} Months</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <View style={styles.detailIconContainer}>
                                            <Icon name="calendar-alt" size={14} color="#fff" />
                                        </View>
                                        <View style={styles.detailContent}>
                                            <Text style={styles.detailLabel}>Monthly Payment</Text>
                                            <Text style={styles.detailValue}>₹{plan.monthlyAmount}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.planFooter}>
                                    <View style={{ flex: 1 }} />
                                    <TouchableOpacity
                                        style={styles.subscribeButton}
                                        onPress={() => handleSubscribe(plan)}
                                        disabled={subscribing === plan._id}
                                    >
                                        {subscribing === plan._id ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                                                <Icon name="arrow-right" size={14} color="#fff" style={{ marginLeft: 5 }} />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    ))}
                </ScrollView>
            );
        } else {
            return (
                <ScrollView
                    contentContainerStyle={styles.aboutContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {merchant.shopImages && merchant.shopImages.length > 0 && (
                        <View>
                            {merchant.shopImages.length === 1 ? (
                                <View style={styles.shopImageContainer}>
                                    <Image
                                        source={{ uri: `${BASE_URL}${merchant.shopImages[0]}` }}
                                        style={styles.shopImage}
                                        resizeMode="cover"
                                    />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                                        style={styles.imageOverlay}
                                    />
                                </View>
                            ) : (
                                <View style={{ marginBottom: 20 }}>
                                    <View style={[styles.sectionHeader, { marginTop: 0 }]}>
                                        <Icon name="images" size={20} color={COLORS.primary} />
                                        <Text style={styles.sectionTitle}>Shop Gallery</Text>
                                    </View>
                                    <View style={styles.imageGrid}>
                                        {merchant.shopImages.map((img, index) => (
                                            <View key={index} style={styles.gridImageContainer}>
                                                <Image
                                                    source={{ uri: `${BASE_URL}${img}` }}
                                                    style={styles.gridImage}
                                                    resizeMode="cover"
                                                />
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.aboutCard}>
                        <View style={styles.sectionHeader}>
                            <Icon name="building" size={20} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Merchant Details</Text>
                        </View>

                        <View style={styles.infoGrid}>
                            <View style={styles.infoCard}>
                                <View style={[styles.infoIcon, { backgroundColor: '#E3F2FD' }]}>
                                    <Icon name="user-tie" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.infoLabel}>Merchant Name</Text>
                                <Text style={styles.infoValue}>{merchant.name}</Text>
                            </View>

                            <View style={styles.infoCard}>
                                <View style={[styles.infoIcon, { backgroundColor: '#F3E5F5' }]}>
                                    <Icon name="map-marked-alt" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.infoLabel}>Location</Text>
                                <Text style={styles.infoValue}>{merchant.address || 'N/A'}</Text>
                            </View>

                            <View style={styles.infoCard}>
                                <View style={[styles.infoIcon, { backgroundColor: '#E8F5E9' }]}>
                                    <Icon name="phone-alt" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.infoLabel}>Contact</Text>
                                <Text style={styles.infoValue}>{merchant.phone || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
                <LinearGradient
                    colors={['#915200', '#e2d183']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Icon name="arrow-left" size={20} color={COLORS.dark} />
                    </TouchableOpacity>

                    <View style={styles.merchantInfo}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>
                                {merchant.name?.charAt(0) || 'M'}
                            </Text>
                        </View>
                        <View style={styles.merchantDetails}>
                            <Text style={styles.merchantName}>{merchant.name}</Text>
                            {merchant.rating && (
                                <View style={styles.ratingContainer}>
                                    <Icon name="star" size={12} color={COLORS.dark} />
                                    <Text style={styles.ratingText}>{merchant.rating}</Text>
                                </View>
                            )}
                            <Text style={styles.merchantLocation}>
                                <Icon name="map-marker-alt" size={10} color={COLORS.dark} /> {merchant.address?.substring(0, 30) || 'Location not specified'}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>

            <View style={styles.tabContainer}>
                <LinearGradient
                    colors={['#fff', '#f8f9ff']}
                    style={styles.tabBackground}
                >
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'plans' && styles.activeTab]}
                        onPress={() => setActiveTab('plans')}
                    >
                        <Icon
                            name="coins"
                            size={18}
                            color={activeTab === 'plans' ? COLORS.primary : COLORS.secondary}
                        />
                        <Text style={[styles.tabText, activeTab === 'plans' && styles.activeTabText]}>
                            Chit Plans
                        </Text>
                        {activeTab === 'plans' && <View style={styles.tabIndicator} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'about' && styles.activeTab]}
                        onPress={() => setActiveTab('about')}
                    >
                        <Icon
                            name="info-circle"
                            size={18}
                            color={activeTab === 'about' ? COLORS.primary : COLORS.secondary}
                        />
                        <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
                            About
                        </Text>
                        {activeTab === 'about' && <View style={styles.tabIndicator} />}
                    </TouchableOpacity>
                </LinearGradient>
            </View>

            <View style={styles.mainContent}>
                {renderContent()}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9ff',
    },
    header: {
        width: '100%',
        overflow: 'hidden',
    },
    headerGradient: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    merchantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 3,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    merchantDetails: {
        flex: 1,
    },
    merchantName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 5,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    ratingText: {
        color: COLORS.dark,
        fontSize: 12,
        marginLeft: 5,
        fontWeight: '600',
    },
    merchantLocation: {
        color: COLORS.dark,
        fontSize: 12,
        opacity: 0.8,
    },
    tabContainer: {
        marginTop: -10,
        paddingHorizontal: 20,
        zIndex: 10,
    },
    tabBackground: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 5,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 12,
        position: 'relative',
    },
    activeTab: {
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.secondary,
        marginLeft: 8,
    },
    activeTabText: {
        color: COLORS.primary,
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 5,
        width: 30,
        height: 3,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    mainContent: {
        flex: 1,
        marginTop: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        color: COLORS.secondary,
        fontSize: 14,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.dark,
        marginTop: 20,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: COLORS.secondary,
        marginTop: 5,
        textAlign: 'center',
    },
    plansContainer: {
        padding: 20,
        paddingTop: 10,
    },
    planCard: {
        marginBottom: 20,
        borderRadius: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    planGradient: {
        padding: 20,
    },
    planDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 15,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    planTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    planName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginRight: 10,
    },
    planAmountContainer: {
        alignItems: 'flex-end',
    },
    planAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    planAmountLabel: {
        fontSize: 11,
        color: COLORS.secondary,
        marginTop: 2,
    },
    planDetails: {
        marginBottom: 20,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    detailIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.secondary,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
    },
    planFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subscribeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    subscribeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    aboutContainer: {
        padding: 20,
    },
    shopImageContainer: {
        height: 200,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        position: 'relative',
    },
    shopImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    aboutCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginLeft: 10,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridImageContainer: {
        width: '48%',
        height: 140,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        backgroundColor: '#fff',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    infoCard: {
        width: '48%',
        backgroundColor: '#f8f9ff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 11,
        color: COLORS.secondary,
        textAlign: 'center',
        marginBottom: 5,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.dark,
        textAlign: 'center',
    },
});

export default MerchantDetailsScreen;