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
    ActivityIndicator,
    Image,
    Dimensions,
    Platform,
    StatusBar,
    RefreshControl,
    LayoutAnimation,
    UIManager
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import RazorpayCheckout from 'react-native-razorpay';
import { COLORS } from '../styles/theme';
import { APIURL, BASE_URL } from '../constants/api';

import CustomAlert from '../components/CustomAlert';
import FCMService from '../services/FCMService';
import { SkeletonItem } from '../components/SkeletonLoader';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const MerchantDetailsScreen = ({ merchant, onBack, user }) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('plans');
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [subscribing, setSubscribing] = useState(null);

    const [subscribedPlanIds, setSubscribedPlanIds] = useState([]);

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

    useEffect(() => {
        fetchPlans();
        fetchMySubscriptions();
    }, []);

    const fetchMySubscriptions = async () => {
        if (!user || !user.token) return;
        try {
            const { data } = await axios.get(`${APIURL}/chit-plans/my-plans`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const ids = data.map(p => p._id);
            setSubscribedPlanIds(ids);
        } catch (error) {
            console.log("Failed to fetch subscriptions", error);
        }
    };

    const fetchPlans = async () => {
        try {
            const { data } = await axios.get(`${APIURL}/chit-plans/merchant/${merchant._id}`);
            setPlans(data.plans || []);
        } catch (error) {
            console.error(error);
            setAlertConfig({ visible: true, title: 'Error', message: 'Failed to load chit plans', type: 'error' });
        } finally {
            setLoadingPlans(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPlans();
        fetchMySubscriptions();
    };

    const handleTabPress = (tab) => {
        if (activeTab !== tab) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setActiveTab(tab);
        }
    };

    const handleSubscribe = async (plan) => {
        setAlertConfig({
            visible: true,
            title: 'Confirm Subscription',
            message: `Are you sure you want to subscribe to ${plan.planName}?`,
            type: 'info',
            buttons: [
                { text: 'Cancel', style: 'cancel', onPress: () => { } },
                {
                    text: 'Subscribe',
                    onPress: async () => {
                        setSubscribing(plan._id);
                        try {
                            const config = {
                                headers: {
                                    Authorization: `Bearer ${user.token}`,
                                },
                            };

                            // 1. Create Order
                            const { data: order } = await axios.post(`${APIURL}/payments/create-subscription-order`, {
                                amount: plan.monthlyAmount,
                                currency: 'INR',
                                chitPlanId: plan._id
                            }, config);

                            // 2. Open Razorpay
                            const options = {
                                description: `Subscription to ${plan.planName}`,
                                image: merchant.shopImages?.[0] ? `${BASE_URL}${merchant.shopImages[0]}` : undefined,
                                currency: 'INR',
                                key: 'rzp_test_S6RoMCiZCpsLo7', // Replace with your actual Key ID from Dashboard
                                amount: order.amount,
                                name: 'Aurum',
                                order_id: order.id,
                                prefill: {
                                    email: user?.email || '',
                                    contact: user?.phone || '',
                                    name: user?.name || ''
                                },
                                theme: { color: COLORS.primary }
                            };

                            RazorpayCheckout.open(options).then(async (data) => {
                                // 3. Verify & Subscribe
                                try {
                                    await axios.post(`${APIURL}/chit-plans/${plan._id}/subscribe`, {
                                        paymentId: data.razorpay_payment_id,
                                        orderId: data.razorpay_order_id,
                                        signature: data.razorpay_signature
                                    }, config);
                                    setAlertConfig({ visible: true, title: 'Success', message: 'Subscribed successfully!', type: 'success' });
                                    FCMService.displayLocalNotification('Subscription Active', `You have successfully subscribed to ${plan.planName}.`);
                                    fetchPlans(); // Refresh to show status if needed
                                    fetchMySubscriptions(); // Refresh subscription status
                                } catch (err) {
                                    console.log(err);
                                    setAlertConfig({ visible: true, title: 'Error', message: 'Payment verified but subscription failed. Contact support.', type: 'error' });
                                }
                            }).catch((error) => {
                                console.log(error);
                                setAlertConfig({ visible: true, title: 'Error', message: `Payment failed: ${error.description}`, type: 'error' });
                            });

                        } catch (error) {
                            console.error(error);
                            setAlertConfig({ visible: true, title: 'Error', message: error.response?.data?.message || 'Failed to initiate subscription', type: 'error' });
                        } finally {
                            setSubscribing(null);
                        }
                    }
                }
            ]
        });
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Icon name="arrow-left" size={20} color={COLORS.primaryDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>A U R U M</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.merchantInfo}>
                <View style={[styles.avatarContainer, { overflow: 'hidden' }]}>
                    {merchant.shopImages && merchant.shopImages.length > 0 ? (
                        <Image
                            source={{ uri: `${BASE_URL}${merchant.shopImages[0]}` }}
                            style={styles.avatarImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={styles.avatarText}>{merchant.name?.charAt(0)?.toUpperCase() || 'M'}</Text>
                    )}
                </View>
                <View style={styles.infoContent}>
                    <Text style={styles.merchantName}>{merchant.name}</Text>
                    {/* <Text style={styles.merchantAddress} numberOfLines={2}>{merchant.address || 'No address'}</Text> */}
                    {/* {merchant.rating && (
                        <View style={styles.ratingContainer}>
                            <Icon name="star" size={12} color="#FFD700" solid />
                            <Text style={styles.ratingText}>{merchant.rating} Rating</Text>
                        </View>
                    )} */}
                </View>
            </View>
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'plans' && styles.activeTab]}
                onPress={() => handleTabPress('plans')}
            >
                <Text style={[styles.tabText, activeTab === 'plans' && styles.activeTabText]}>Chit Plans</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'about' && styles.activeTab]}
                onPress={() => handleTabPress('about')}
            >
                <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>About</Text>
            </TouchableOpacity>
        </View>
    );

    const renderPlans = () => {
        if (loadingPlans) {
            return (
                <View style={styles.plansList}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={styles.planCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                                <SkeletonItem width="50%" height={20} />
                                <SkeletonItem width="20%" height={20} borderRadius={10} />
                            </View>
                            <SkeletonItem width="30%" height={12} style={{ marginBottom: 5 }} />
                            <SkeletonItem width="60%" height={30} style={{ marginBottom: 15 }} />
                            <SkeletonItem width="100%" height={40} style={{ marginBottom: 20 }} />
                            <SkeletonItem width="100%" height={50} borderRadius={8} />
                        </View>
                    ))}
                </View>
            );
        }

        if (plans.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={{ fontSize: 16, color: COLORS.secondary }}>No chit plans available for this merchant.</Text>
                </View>
            );
        }

        return (
            <View style={styles.plansList}>
                {plans.map(plan => {
                    const isSubscribed = subscribedPlanIds.includes(plan._id);

                    return (
                        <View key={plan._id} style={styles.planCard}>
                            <View style={styles.planHeader}>
                                <Text style={styles.planName}>{plan.planName}</Text>
                                {/* <View style={styles.badge}>
                                    <Text style={styles.badgeText}>Popular</Text>
                                </View> */}
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
                                style={[
                                    styles.subscribeButton,
                                    isSubscribed && styles.subscribedButton
                                ]}
                                onPress={() => handleSubscribe(plan)}
                                disabled={subscribing === plan._id || isSubscribed}
                            >
                                {subscribing === plan._id ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.subscribeText}>
                                        {isSubscribed ? 'Subscribed' : 'Subscribe Now'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderAbout = () => (
        <View style={styles.aboutContainer}>
            {merchant.shopImages && merchant.shopImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
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
        <LinearGradient
            colors={['#ebdc87', '#f3e9bd']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

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
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 25,
        backgroundColor: 'transparent',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primaryDark,
        letterSpacing: 2,
    },
    merchantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
    },
    infoContent: {
        flex: 1,
        justifyContent: 'center',
    },
    merchantName: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.dark,
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    merchantAddress: {
        fontSize: 14,
        color: COLORS.secondary,
        marginBottom: 8,
        lineHeight: 20,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ratingText: {
        marginLeft: 5,
        fontSize: 13,
        color: COLORS.dark,
        fontWeight: '700',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 0,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 16,
        color: COLORS.secondary,
        fontWeight: '600',
    },
    activeTabText: {
        color: COLORS.primaryDark,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        minHeight: 200,
    },
    plansList: {
        padding: 20,
        paddingBottom: 40,
    },
    planCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    planName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    badge: {
        backgroundColor: '#FFF9C4',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    badgeText: {
        color: '#FBC02D',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    amountLabel: {
        fontSize: 13,
        color: COLORS.secondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    amountValue: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.primaryDark,
        marginBottom: 20,
    },
    planDetails: {
        flexDirection: 'row',
        marginBottom: 24,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'space-between',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        marginLeft: 8,
        color: COLORS.secondary,
        fontSize: 14,
        fontWeight: '600',
    },
    subscribeButton: {
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    subscribedButton: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0.1,
    },
    subscribeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    aboutContainer: {
        padding: 20,
    },
    gallery: {
        marginBottom: 24,
        marginTop: 8,
    },
    galleryImage: {
        width: 180,
        height: 120,
        borderRadius: 12,
        marginRight: 12,
    },
    section: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoText: {
        fontSize: 15,
        color: COLORS.dark,
        flex: 1,
        marginLeft: 8,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.secondary,
        textAlign: 'center',
    },
});

export default MerchantDetailsScreen;