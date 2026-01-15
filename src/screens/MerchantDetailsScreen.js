/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
    Dimensions,
    Platform,
    StatusBar,
    RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { COLORS } from '../styles/theme';
import { APIURL, BASE_URL } from '../constants/api';

const { width } = Dimensions.get('window');

const MerchantDetailsScreen = ({ merchant, onBack }) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('plans');
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [subscribing, setSubscribing] = useState(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data } = await axios.get(`${APIURL}/chit-plans/merchant/${merchant._id}`);
            setPlans(data.plans || []);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load chit plans');
        } finally {
            setLoadingPlans(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPlans();
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

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Icon name="arrow-left" size={20} color={COLORS.dark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>A U R U M</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.merchantInfo}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{merchant.name?.charAt(0)?.toUpperCase() || 'M'}</Text>
                </View>
                <View style={styles.infoContent}>
                    <Text style={styles.merchantName}>{merchant.name}</Text>
                    <Text style={styles.merchantAddress} numberOfLines={2}>{merchant.address || 'No address'}</Text>
                    {merchant.rating && (
                        <View style={styles.ratingContainer}>
                            <Icon name="star" size={12} color="#FFD700" solid />
                            <Text style={styles.ratingText}>{merchant.rating}</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'plans' && styles.activeTab]}
                onPress={() => setActiveTab('plans')}
            >
                <Text style={[styles.tabText, activeTab === 'plans' && styles.activeTabText]}>Chit Plans</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'about' && styles.activeTab]}
                onPress={() => setActiveTab('about')}
            >
                <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>About</Text>
            </TouchableOpacity>
        </View>
    );

    const renderPlans = () => {
        if (loadingPlans) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            );
        }

        if (plans.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>No plans available</Text>
                </View>
            );
        }

        return (
            <View style={styles.plansList}>
                {plans.map(plan => (
                    <View key={plan._id} style={styles.planCard}>
                        <View style={styles.planHeader}>
                            <Text style={styles.planName}>{plan.planName}</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Popular</Text>
                            </View>
                        </View>

                        <Text style={styles.amountLabel}>Total Amount</Text>
                        <Text style={styles.amountValue}>₹{plan.totalAmount}</Text>

                        <View style={styles.planDetails}>
                            <View style={styles.detailItem}>
                                <Icon name="clock" size={14} color={COLORS.secondary} />
                                <Text style={styles.detailText}>{plan.durationMonths} Months</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Icon name="calendar-alt" size={14} color={COLORS.secondary} />
                                <Text style={styles.detailText}>₹{plan.monthlyAmount}/mo</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.subscribeButton}
                            onPress={() => handleSubscribe(plan)}
                            disabled={subscribing === plan._id}
                        >
                            {subscribing === plan._id ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.subscribeText}>Subscribe Now</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        );
    };

    const renderAbout = () => (
        <View style={styles.aboutContainer}>
            {merchant.shopImages && merchant.shopImages.length > 0 && (
                <ScrollView horizontal check showsHorizontalScrollIndicator={false} style={styles.gallery}>
                    {merchant.shopImages.map((img, i) => (
                        <Image
                            key={i}
                            source={{ uri: `${BASE_URL}${img}` }}
                            style={styles.galleryImage}
                        />
                    ))}
                </ScrollView>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.infoRow}>
                    <Icon name="phone" size={16} color={COLORS.primary} style={{ width: 25 }} />
                    <Text style={styles.infoText}>{merchant.phone || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Icon name="map-marker-alt" size={16} color={COLORS.primary} style={{ width: 25 }} />
                    <Text style={styles.infoText}>{merchant.address || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Icon name="envelope" size={16} color={COLORS.primary} style={{ width: 25 }} />
                    <Text style={styles.infoText}>{merchant.email || 'N/A'}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {renderHeader()}
            {renderTabs()}

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {activeTab === 'plans' ? renderPlans() : renderAbout()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primaryDark,
    },
    merchantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
    },
    infoContent: {
        flex: 1,
    },
    merchantName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 4,
    },
    merchantAddress: {
        fontSize: 14,
        color: COLORS.secondary,
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        marginLeft: 5,
        fontSize: 14,
        color: COLORS.dark,
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 16,
        color: COLORS.secondary,
        fontWeight: '500',
    },
    activeTabText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        backgroundColor: '#f8f9ff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    plansList: {
        padding: 20,
    },
    planCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    planName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    badge: {
        backgroundColor: '#FFF9C4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#FBC02D',
        fontSize: 12,
        fontWeight: 'bold',
    },
    amountLabel: {
        fontSize: 12,
        color: COLORS.secondary,
        marginBottom: 2,
    },
    amountValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 15,
    },
    planDetails: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#f8f9ff',
        padding: 10,
        borderRadius: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    detailText: {
        marginLeft: 6,
        color: COLORS.secondary,
        fontSize: 14,
    },
    subscribeButton: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    subscribeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    aboutContainer: {
        padding: 20,
    },
    gallery: {
        marginBottom: 20,
    },
    galleryImage: {
        width: 150,
        height: 100,
        borderRadius: 8,
        marginRight: 10,
    },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoText: {
        fontSize: 16,
        color: COLORS.dark,
        flex: 1,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.secondary,
    },
});

export default MerchantDetailsScreen;